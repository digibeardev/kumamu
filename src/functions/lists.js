module.exports = mu => {
  // Itemize.
  const parser = mu.parser;
  parser.setFunction("itemize", async (en, args, scope) => {
    let list = await parser.evaluate(en, args[0], scope);
    const delim = args[1] ? await parser.evaluate(en, args[1], scope) : " ";
    const conj = args[2] ? await parser.evaluate(en, args[2], scope) : "and";
    const punc = args[3] ? await parser.evaluate(en, args[3], scope) : ",";

    list = list.split(delim);

    if (list.length === 1) {
      return list[0];
    } else if (list.length === 2) {
      return list[0] + " " + conj + " " + list[1];
    } else if (list.length > 2) {
      let lastEl = list.pop();
      let output = list.reduce((acc, curr) => {
        return (acc = acc + punc + " " + curr);
      });
      output += " " + conj + " " + lastEl;
      return output;
    } else {
      return "";
    }
  });

  // List iterator.
  parser.setFunction("iter", async (en, args, scope) => {
    const list = await parser
      .evaluate(en, args[0], scope)
      .catch(() => "#-1 LIST REQUIRED");
    const idelim = args[2] ? await parser.evaluate(en, args[2]) : " ";
    const odelim = args[3] ? await parser.evaluate(en, args[3]) : idelim;
    let text = [];
    for (const item of list.split(idelim)) {
      scope = {
        ...scope,
        ...{ "##": item, "#@": list.split(idelim).indexOf(item) + 1 }
      };
      text.push(await parser.evaluate(en, args[1], scope));
    }

    return text.join(odelim);
  });
};
