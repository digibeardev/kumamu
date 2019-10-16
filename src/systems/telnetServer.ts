import { TelnetServer, TelnetSocket } from "../classes/telnet";

const startup = () => {
  const server = new TelnetServer(socket => {
    const tSocket = new TelnetSocket(socket);

    tSocket.write("Welcome to the server!\r\n", "utf-8");

    tSocket.on("data", (data: Buffer) => {
      tSocket.write(data.toString() + "\r\n", "utf-8");
    });
  }).netServer;

  server.listen(4000);
};

export default startup;
