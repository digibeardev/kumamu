module.exports = mu => {
  class Queue {
    constructor() {
      this.pQueue = [];
      this.oQueue = [];
      this.sockets = new Map();
    }

    /**
     * Retrieve a socket based on an associalted entity key.
     * @param {string} key The entity key.
     */
    keyToSocket(key) {
      return this.sockets.get(key);
    }
  }
  return new Queue();
};
