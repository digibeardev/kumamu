import { TelnetServer, TelnetSocket } from "../classes/telnet";
import mu from "../classes/engine";
const startup = () => {
  const server = new TelnetServer(socket => {
    const tSocket = new TelnetSocket(socket);

    mu.msg.send(tSocket, mu.txt.get("connect"));

    tSocket.on("data", (data: Buffer) => {
      mu.queues.pQueue.push({ socket: tSocket, data: data.toString("utf-8") });
    });
  }).netServer;

  server.listen(4000);
};

export default startup;
