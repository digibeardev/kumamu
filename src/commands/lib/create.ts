import mu from "../../classes/engine";
import { ItSocket } from "../../classes/telnet";

export const pattern = /^create\s+(.*)\s+(.*)/;

export const run = (socket: ItSocket, match: string[], scope: object) => {
  if (socket._key) {
    const playerCursor = mu.db.objs.all();
  }
};
