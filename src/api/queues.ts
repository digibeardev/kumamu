import { Socket } from "net";
import { TelnetSocket } from "classes/telnet";

interface IPQueue {
  socket: TelnetSocket;
  data: any;
}

export class Queue {
  pQueue: IPQueue[];
  oQueue: string[];
  sockets: Map<string, Socket>;
  constructor() {
    this.pQueue = [];
    this.oQueue = [];
    this.sockets = new Map();
  }

  public keyToSocket(key: string) {
    return this.sockets.get(key);
  }
}

export default new Queue();
