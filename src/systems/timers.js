module.exports = mu => {
  // Tick
  setInterval(() => {
    if (mu.queues.pQueue.length > 0) {
      const { socket, data } = mu.queues.pQueue[0];
      mu.handle(socket, data);
      mu.queues.pQueue.shift();
    }
  }, 15);
};
