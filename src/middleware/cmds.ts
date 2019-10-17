import { IDataWrapper, FuncNextType } from "classes/engine";
import { Socket } from "net";

export interface ICommand {
  pattern: RegExp | string;
  flags: string;
  run: (socket: Socket, match: string[], scope: object) => void;
}

const cmds = async (dataWrapper: IDataWrapper, next: FuncNextType) => {
  const { input, game, socket } = dataWrapper;

  const mu = game;
  // Cycle through the commands on the command object looking for a
  //  match in the users input string if no matching exit was found.
  for (const command of mu.cmds.values()) {
    const { pattern, run, restriction } = command;
    const match = input.match(pattern);

    const obj = await mu.flags.hasFlags(
      await mu.db.key(socket._key),
      restriction
    );

    // If there's a match and the enactor passes the flag restriction of
    // the command or there's no restriction set, try to run the command.
    if ((match && obj) || (match && !restriction)) {
      // Try/Catch block just in case the command doesn't
      // go through, there's an error, or if the command
      // just straight doesn't exist.
      try {
        dataWrapper.ran = true;
        run(socket, match, mu.scope);
        mu.emitter.emit("command", match);
        next(null, dataWrapper);
      } catch (error) {
        next(error);
      }
    }
  }
  // No evaluation, return to the handler.
  next(null, dataWrapper);
};

export default cmds;
