import { ItSocket } from "../classes/telnet";
import objs, { IDbObj } from "../api/db/collections/objs";
import msg from "../api/msg";
import config from "../api/config";
import flags from "../api/db/collections/flags";
const sha256 = require("sha256");

export default {
  pattern: /^create\s+(.*)\s+(.*)/,
  async run(socket: ItSocket, match: string, scope: object) {
    if (!socket._key) {
      // Make sure the name isn't assigned elsewhere.
      if (!(await objs.id(match[1]))) {
        const results = await objs
          .create({
            name: match[1].trim(),
            type: "player",
            password: sha256(match[2].trim())
          })
          .catch(error => console.log(error));
        if (results._key) {
          const count = (await objs.all()).filter(
            (obj: IDbObj) => obj.type === "player"
          ).length;
          socket._key = results._key;
          msg.send(
            socket,
            `Login successful, Welcome to %ch${config.game.name ||
              "KumaMU"}%cn!`
          );
          if (count) {
            flags.set(results, "connected");
          } else {
            flags.set(results, "connected immortal");
          }
          const char = await objs.id(results);
          if (!char.location) {
            objs.update(results, { location: objs.startingRoom });
          }
        }
      } else {
        msg.send(socket, "That name is either illegal, or already in use.");
      }
    }
  }
};
