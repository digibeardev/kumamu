import { IDataWrapper, FuncNextType } from "classes/engine";
import { Socket } from "net";
import mu from "../classes/engine";

export interface ICommand {
  pattern: RegExp | string;
  flags: string;
  run: (socket: Socket, match: string[], scope: object) => void;
}

const cmds = async (dataWrapper: IDataWrapper, next: FuncNextType) => {
  const { input, socket } = dataWrapper;

  // Cycle through the commands on the command object looking for a
  //  match in the users input string if no matching exit was found.
  for (const command of mu.cmds.values()) {
    const { pattern, run, flags } = command;
    const match = input.match(pattern);

    const obj = await mu.flags.hasFlags(
      await mu.db.objs.id(socket._key),
      flags
    );

    // If there's a match and the enactor passes the flag restriction of
    // the command or there's no restriction set, try to run the command.
    if ((match && obj) || (match && !flags)) {
      // Try/Catch block just in case the command doesn't
      // go through, there's an error, or if the command
      // just straight doesn't exist.
      try {
        dataWrapper.ran = true;
        await run(socket, match, mu.scope);
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
