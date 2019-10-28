//@ts-check
const net = require("net");
const config = require("../api/config");
const { TelnetSocket } = require("telnet-stream");

// create socket connection
const server = net.createServer(socket => {
  const tSocket = new TelnetSocket(socket);

  tSocket.on(
    "data",
    /** @param {Buffer} buffer */ buffer => {
      tSocket.write(buffer.toString("utf-8"));
    }
  );
});

server.listen(config.game.port || 4000, () => {
  console.log(`Telnet server connected on port: ${config.game.port || 4000}`);
});
