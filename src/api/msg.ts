import parser from "../api/parser";
import { TelnetSocket } from "../classes/telnet";

export class Message {
  /**
   * Send a message to a soocket.
   * @param socket The network socket to send the message to.
   * @param message The message to send.
   * @param options Any options passed along with with the
   * send statement.
   */
  send(socket: TelnetSocket, message: string, options?: object) {
    socket.write(
      parser
        .subs(message)
        .replace("\u250D", "(")
        .replace("\u2511", ")") + "\r\n",
      "utf-8"
    );
  }
}

export default new Message();
