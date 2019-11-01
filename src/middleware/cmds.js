//@ts-check
module.exports = mu => {
  /**
   * Process a command.
   * @param {*} dataWrapper The data passed in from engine.ts.
   * @param {*} next Takes two parameters.  Pass data and errors back to engine.ts.
   */
  const cmds = async (dataWrapper, next) => {
    const { input, socket } = dataWrapper;

    // Cycle through the commands on the command object looking for a
    //  match in the users data: string if no matching exit was found.
    for (const v of mu.cmds.values()) {
      const { pattern, flags = "", run } = v;

      const match = input.replace("\r\n", "").match(pattern);

      let obj = false;

      if (flags) {
        obj = mu.flags.hasFlags(await mu.entities.key(socket._key), flags);
      }

      // If there's a match and the enactor passes the flag restriction of
      // the command or there's no restriction set, try to run the command.
      if ((match && obj) || (match && !flags)) {
        // Try/Catch block just in case the command doesn't
        // go through, there's an error, or if the command
        // just straight doesn't exist.
        try {
          dataWrapper.ran = true;
          await run(socket, match, mu.scope);
          next(null, dataWrapper);
        } catch (error) {
          next(error);
        }
      }
    }
    // No evaluation, return to the handler.
    next(null, dataWrapper);
  };

  mu.use(cmds);
};
