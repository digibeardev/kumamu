import { TelnetServer, TelnetSocket } from "../classes/telnet";
import msg from "../api/msg";
import queues from "../api/queues";
import txt from "../api/txt";

const startup = () => {
  const server = new TelnetServer(socket => {
    const tSocket = new TelnetSocket(socket);

    msg.send(tSocket, txt.get("connect")!);

    tSocket.on("data", (data: Buffer) => {
      queues.pQueue.push({ socket: tSocket, data: data.toString("utf-8") });
    });
  }).netServer;

  server.listen(4000);
};

export default startup;
