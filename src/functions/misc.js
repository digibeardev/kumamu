const moment = require("moment");

module.exports = mu => {
  const parser = mu.parser;
  parser.setFunction("idlestr", async (en, args, scope) => {
    const ref = await parser.evaluate(en, args[0], scope);
    const entities = await mu.entities.find(ref);
    const entity = entities.length > 0 ? entities[0] : false;

    const timestamp = mu.queues.keyToSocket(entity._key)
      ? mu.queues.keyToSocket(entity._key).timestamp
      : -1;

    return timestamp >= 0
      ? moment.unix(timestamp).fromNow(true)
      : "#-1 TARGET NOT FOUND";
  });
};
