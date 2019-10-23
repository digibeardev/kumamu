import { TelnetServer, TelnetSocket } from "../classes/telnet";
import msg from "../api/msg";
import queues from "../api/queues";
import txt from "../api/txt";
import config from "../api/config";
import objs, { IDbObj } from "../api/db/collections/objs";

const startup = () => {
  const server = new TelnetServer(async socket => {
    const tSocket = new TelnetSocket(socket);
    const count = (await objs.all()).filter(
      (obj: IDbObj) => obj.type === "player"
    ).length;
    msg.send(tSocket, txt.get("connect")!);
    if (!count) {
      msg.send(tSocket, "Please Create an %chimmortal%cn account.");
    }
    tSocket.on("data", (data: Buffer) => {
      queues.pQueue.push({ socket: tSocket, data: data.toString("utf-8") });
    });
  }).netServer;

  server.listen(config.game.port || 4000);
};

export default startup;
