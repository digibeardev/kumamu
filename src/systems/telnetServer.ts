import { TelnetServer, TelnetSocket } from "../classes/telnet";
import msg from "../api/msg";
import queues from "../api/queues";
import txt from "../api/txt";
import config from "../api/config";

const startup = () => {
  const server = new TelnetServer(socket => {
    const tSocket = new TelnetSocket(socket);

    msg.send(tSocket, txt.get("connect")!);

    tSocket.on("data", (data: Buffer) => {
      queues.pQueue.push({ socket: tSocket, data: data.toString("utf-8") });
    });
  }).netServer;

  server.listen(config.game.port || 4000);
};

export default startup;
