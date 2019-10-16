import { Socket } from "net";

class Queue {
  private pQueue: string[];
  private oQueue: string[];
  private sockets: Map<string, Socket>;
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