import mu from "../classes/engine";
import queues from "../api/queues";
import flags from "../api/flags";
import dbObjs from "../api/db/collections/objs";
import msg from "../api/msg";

const startup = () => {
  // Tick
  setInterval(() => {
    if (queues.pQueue.length > 0) {
      const { socket, data } = queues.pQueue[0];
      mu.handle(socket, data);
      queues.pQueue.shift();
    }
  }, 15);

  // Registration reminding timer.
  setInterval(async () => {
    queues.sockets.forEach(async (v: any) => {
      if (flags.hasFlags(await dbObjs.id(v._key), "!registered")) {
        msg.send(
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
