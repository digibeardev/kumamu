/* 
 Based on Ranvier-Telnet: https://github.com/RanvierMUD/ranvier-telnet
 Copyright (c) 2017 Shawn Biddle, http://shawnbiddle.com/

  Permission is hereby granted, free of charge, to any person obtaining
  a copy of this software and associated documentation files (the
  "Software"), to deal in the Software without restriction, including
  without limitation the rights to use, copy, modify, merge, publish,
  distribute, sublicense, and/or sell copies of the Software, and to
  permit persons to whom the Software is furnished to do so, subject to
  the following conditions:

  The above copyright notice and this permission notice shall be
  included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
  LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
  OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
  WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import { EventEmitter } from "events";
import net, { Socket, Server } from "net";

export enum TelnetSeq {
  IAC = 255,
  DONT = 254,
  DO = 253,
  WONT = 252,
  WILL = 251,
  SB = 250,
  SE = 240,
  GA = 249,
  EOR = 239
}

export interface ItSocket extends Socket {
  _key: string;
}

export enum TelnetOpts {
  OPT_ECHO = 1,
  OPT_EOR = 25,
  OPT_GMCP = 201
}

export class TelnetSocket extends EventEmitter {
  private socket: Socket | any;
  private echoing: Boolean;
  private gaMode: any;
  maxInputLength: number;

  constructor(socket: Socket, opts: object | any = {}) {
    super();
    this.attach(socket);
    this.echoing = true;
    this.gaMode = null;
    this.maxInputLength = opts.maximumInputLength || 1024;
  }

  get readable() {
    return this.socket.readable;
  }

  get writeable() {
    return this.socket.writable;
  }

  get address() {
    return this.socket.address();
  }

  write(data: Buffer | string, encoding: BufferEncoding) {
    if (!Buffer.isBuffer(data)) {
      data = new Buffer(data, encoding);
    }

    let iacs = 0;
    for (const val of data.values()) {
      if (val === TelnetSeq.IAC) {
        iacs++;
      }
    }

    if (iacs) {
      let b = new Buffer(data.length + iacs);
      for (let i = 0, j = 0; i < data.length; i++) {
        b[j++] = data[i];
        if (data[i] == TelnetSeq.IAC) {
          b[j++] = TelnetSeq.IAC;
        }
      }
    }

    try {
      if (!this.socket.ended && !this.socket.finished) {
        this.socket.write(data);
      }
    } catch (error) {
      this.emit("error", error);
    }
  }

  setEncoding(encoding: BufferEncoding) {
    this.socket.setEncoding(encoding);
  }

  pause() {
    this.socket.pause();
  }

  resume() {
    this.socket.resume();
  }

  destroy() {
    this.socket.destroy();
  }

  telnetCommand(willingness: TelnetSeq, command: number) {
    let seq = [TelnetSeq.IAC, willingness];
    if (Array.isArray(command)) {
      seq.push.apply(seq, command);
    } else {
      seq.push(command);
    }

    this.socket.write(new Buffer(seq));
  }

  toggleEcho() {
    this.echoing = !this.echoing;
    this.telnetCommand(
      this.echoing ? TelnetSeq.WONT : TelnetSeq.WILL,
      TelnetOpts.OPT_ECHO
    );
  }

  sendGMCP(gmcpPackage: string, data: object) {
    const gmpcData = gmcpPackage + " " + JSON.stringify(data);
    const dataBuffer = Buffer.from(gmpcData);
    const seqStartBuffer = new Buffer([
      TelnetSeq.IAC,
      TelnetSeq.SB,
      TelnetOpts.OPT_GMCP
    ]);

    const seqEndBuffer = new Buffer([TelnetSeq.IAC, TelnetSeq.SE]);
    this.socket.write(
      Buffer.concat(
        [seqStartBuffer, dataBuffer, seqEndBuffer],
        gmpcData.length + 5
      )
    );
  }

  private attach(connection: Socket | any) {
    this.socket = connection;
    let inputbuf = new Buffer(1024);
    let inputlen = 0;

    connection.on("error", (err: Error) => this.emit("error", err));

    this.socket.write("\r\n");
    connection.on("data", (databuf: Buffer) => {
      databuf.copy(inputbuf, inputlen);
      inputlen += databuf.length;

      if (connection.fresh && databuf[0] !== TelnetSeq.IAC) {
        connection.fresh = false;
      }

      databuf = inputbuf.slice(0, inputlen);

      // fresh makes sure that even if we haven't gotten a newline but the client
      // sent us some initial negotiations to still interpret them
      if (!databuf.toString().match(/[\r\n]/) && !connection.fresh) {
        return;
      }

      // If multiple commands were sent \r\n separated in the same packet process
      // them separately. Some client auto-connect features do this
      let bucket = [];
      for (let i = 0; i < inputlen; i++) {
        if (databuf[i] !== 10 && databuf[i] !== 13) {
          // neither LF nor CR
          bucket.push(databuf[i]);
        } else {
          // look ahead to see if our newline delimiter is part of a combo.
          if (
            i + 1 < inputlen &&
            (databuf[i + 1] === 10 || databuf[i + 1] === 13) &&
            databuf[i] !== databuf[i + 1]
          ) {
            i++;
          }
          this.input(Buffer.from(bucket));
          bucket = [];
        }
      }

      if (bucket.length) {
        this.input(Buffer.from(bucket));
      }

      inputbuf = new Buffer(this.maxInputLength);
      inputlen = 0;
    });

    connection.on("close", () => this.emit("close"));
  }

  input(inputbuf: Buffer) {
    // strip any negotiations
    let cleanbuf = Buffer.alloc(inputbuf.length);
    let i = 0;
    let cleanlen = 0;
    let subnegBuffer = null;
    let subnegOpt = null;

    while (i < inputbuf.length) {
      if (inputbuf[i] !== TelnetSeq.IAC) {
        if (inputbuf[i] < 32) {
          // Skip any freaky control codes.
          i++;
        } else {
          cleanbuf[cleanlen++] = inputbuf[i++];
        }
        continue;
      }

      const cmd = inputbuf[i + 1];
      const opt = inputbuf[i + 2];
      switch (cmd) {
        case TelnetSeq.DO:
          switch (opt) {
            case TelnetOpts.OPT_EOR:
              this.gaMode = TelnetSeq.EOR;
              break;
            default:
              /**
               * @event TelnetSocket#DO
               * @param {number} opt
               */
              this.emit("DO", opt);
              break;
          }
          i += 3;
          break;
        case TelnetSeq.DONT:
          switch (opt) {
            case TelnetOpts.OPT_EOR:
              this.gaMode = TelnetSeq.GA;
              break;
            default:
              /**
               * @event TelnetSocket#DONT
               * @param {number} opt
               */
              this.emit("DONT", opt);
          }
          i += 3;
          break;
        case TelnetSeq.WILL:
          /**
           * @event TelnetSocket#WILL
           * @param {number} opt
           */
          this.emit("WILL", opt);
          i += 3;
          break;
        /* falls through */
        case TelnetSeq.WONT:
          /**
           * @event TelnetSocket#WONT
           * @param {number} opt
           */
          this.emit("WONT", opt);
          i += 3;
          break;
        case TelnetSeq.SB:
          i += 2;
          subnegOpt = inputbuf[i++];
          subnegBuffer = Buffer.alloc(inputbuf.length - i, " ");

          let sublen = 0;
          while (inputbuf[i] !== TelnetSeq.IAC) {
            subnegBuffer[sublen++] = inputbuf[i++];
          }
          break;
        case TelnetSeq.SE:
          if (subnegOpt === TelnetOpts.OPT_GMCP) {
            let gmcpString = subnegBuffer!.toString().trim();

            //@ts-ignore
            let [gmcpPackage, ...gmcpData] = gmcpString.split(" ");
            //@ts-ignore
            gmcpData = gmcpData.join(" ");
            //@ts-ignore
            gmcpData = gmcpData.length ? JSON.parse(gmcpData) : null;
            /**
             * @event TelnetSocket#GMCP
             * @param {string} gmcpPackage
             * @param {*} gmcpData
             */
            this.emit("GMCP", gmcpPackage, gmcpData);
          } else {
            /**
             * @event TelnetSocket#SUBNEG
             * @param {number} subnegOpt SB option
             * @param {Buffer} subnegBuffer Buffer of data inside subnegotiation package
             */
            this.emit("SUBNEG", subnegOpt, subnegBuffer);
          }
          i += 2;
          break;
        default:
          /**
           * @event TelnetSocket#unknownAction
           * @param {number} cmd Command byte specified after IAC
           * @param {number} opt Opt byte specified after command byte
           */
          this.emit("unknownAction", cmd, opt);
          i += 2;
          break;
      }
    }

    if (this.socket.fresh) {
      this.socket.fresh = false;
      return;
    }

    /**
     * @event TelnetSocket#data
     * @param {Buffer} data
     */
    this.emit(
      "data",
      cleanbuf.slice(0, cleanlen >= cleanbuf.length ? undefined : cleanlen)
    ); // special processing required for slice() to work.
  }
}

export class TelnetServer {
  netServer: Server;

  /**
   * @param {object}   streamOpts options for the stream
   * @param {function} listener   connected callback
   */
  constructor(listener: (socket: Socket) => void) {
    this.netServer = net.createServer({}, (socket: Socket | any) => {
      socket.fresh = true;
      listener(socket);
    });
  }
}
