module.exports = mu => {
  mu.addCommand({
    name: "page",
    pattern: /(?:^p|^page) ((.*)\s?=\s?)?(.*)/,
    restruction: "connected",
    run: async (socket, data) => {
      // Build the target list
      let list = [];

      const enactor = await mu.entities.get(socket._key);

      if (data[2]) {
        for (const tar of data[2].split(" ")) {
          let target = await mu.entities.find(tar);
          if (mu.queues.sockets.has(target[0]._key)) {
            if (target.length > 0) {
              target = target[0];
              list.push(target);
            }
          }
        }
        list = [...list, enactor];
        // Save the target list for future pages.
        socket.page = Array.from(list);
        mu.queues.sockets.set(socket._key, socket);
        // Iterate through the list and make sure everyone has
        // a copy of the list
        for (const sock of list) {
          const socket = mu.queues.keyToSocket(sock._key);
          if (socket) {
            socket.page = list;
            mu.queues.sockets.set(socket._key, socket);
          }
        }
      } else if (socket.page) {
        // Use stored list instead
        if (socket.page.length > 0) {
          for (const tar of socket.page) {
            if (tar) {
              list.push(tar);
            }
          }
        }
      } else {
        // No list, provided or stored.
        return mu.msg.send(socket, "Who are you trying to page?");
      }

      data[3] = data[3].trim();
      let message;
      let ignore = [];
      ignore.push(enactor);

      if (data[3][0] === ":") {
        message = enactor.moniker
          ? enactor.moniker +
            (enactor.alias ? "(" + enactor.alias + ")" : "") +
            " " +
            data[3].slice(1)
          : enactor.name +
            (enactor.alias ? "(" + enactor.alias + ")" : "") +
            " " +
            data[3].slice(1);
      } else if (data[3][0] === ";") {
        message = enactor.moniker
          ? enactor.moniker +
            (enactor.alias ? "(" + enactor.alias + ")" : "") +
            data[3].slice(1)
          : enactor.name +
            (enactor.alias ? "(" + enactor.alias + ")" : "") +
            data[3].slice(1);
      } else {
        message = enactor.moniker
          ? enactor.moniker +
            (enactor.alias ? "(" + enactor.alias + ")" : "") +
            data[3].slice(1)
          : enactor.name +
            (enactor.alias ? "(" + enactor.alias + ")" : "") +
            " pages: " +
            data[3];
      }

      mu.msg.sendGroup({
        enactor,
        targets: socket.page,
        message,
        flags: "connected",
        ignore
      });
    }
  });
};
