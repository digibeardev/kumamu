import mu from "../classes/engine";

const startup = () => {
  // Tick
  setInterval(() => {
    if (mu.queues.pQueue.length > 0) {
      const { socket, data } = mu.queues.pQueue[0];
      mu.handle(socket, data);
      mu.queues.pQueue.shift();
    }
  }, 15);

  // Registration reminding timer.
  setInterval(async () => {
    mu.queues.sockets.forEach(async (v: any) => {
      if (mu.flags.hasFlags(await mu.db.objs.id(v._key), "!registered")) {
        mu.broadcast.send(
          v,
          "Your character isn't registered. " +
            "Please take a moment to register!%rSee '%ch+help @account%cn'" +
            " For more information."
        );
      }
    });
  }, 1800000);
};

export default startup;
