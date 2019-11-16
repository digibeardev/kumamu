module.exports = mu => {
  const parser = mu.parser;
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
