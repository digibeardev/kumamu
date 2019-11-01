//@ts-check
const net = require("net");
const config = require("../api/config");
const { TelnetSocket } = require("telnet-stream");

module.exports = mu => {
  // create socket connection
  const server = net.createServer(async socket => {
    const tSocket = new TelnetSocket(socket);

    // Send welcome message.
    mu.msg.send(tSocket, mu.txt.get("connect"));

    const chars = await mu.entities.all(entity => entity.type === "player");

    if (chars.length <= 0) {
      mu.msg.send(tSocket, "Please create your %chImmortal%cn Character.");
    }

    tSocket.on(
      "data",
      /** @param {Buffer} buffer */ buffer => {
        mu.queues.pQueue.push({
          socket: tSocket,
          data: buffer.toString("utf-8")
        });
      }
    );
  });

  server.listen(config.game.port || 4000, () => {
    console.log(`Telnet server connected on port: ${config.game.port || 4000}`);
  });
};
