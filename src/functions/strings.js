module.exports = parser => {
  /**
   * Find the remainder for string length.
   * @param {string} string The string to process.
   * @param {number} length The length of the string.
   */
  const remainder = (string = "", length) =>
    Math.floor(length % parser.stripSubs(string).length);

  /**
   * Repeat a string.
   * @param {string} string The string to repeat.
   * @param {number} length The length to repeat.
   */
  const repeatString = (string = "", length) => {
    let cleanArray = string.split("%").filter(Boolean);

    cleanArray.length > 1
      ? cleanArray
          .filter(cell => (cell.toLowerCase() !== "cn" ? true : false))
          .map(cell => parser.subs("%" + cell + "%cn"))
      : cleanArray[0].split("");

    return (
      string.repeat(length / parser.stripSubs(string).length) +
      cleanArray.slice(0, remainder(string, length))
    );
  };

  // Center a string.
  parser.setFunction("center", async (en, args, scope) => {
    if (args.length < 2) {
      throw new SyntaxError("center requires at least 2 arguments");
    } else {
      const message = args[0]
        ? await parser.evaluate(en, args[0], scope)
        : "#-1 NO MESSAGE PROVIDED";
      const width = args[1]
        ? parseInt(await parser.evaluate(en, args[1], scope), 10)
        : "#-2 WIDTH IS REQUIRED";
      const repeat = args[2] ? await parser.evaluate(en, args[2], scope) : "";
      const length = (width - parser.stripSubs(message).length) / 2;
      const remainder = (width - parser.stripSubs(message).length) % 2;

      return (
        repeatString(repeat, length) +
        message +
        repeatString(repeat, length + remainder)
      );
    }
  });
};
