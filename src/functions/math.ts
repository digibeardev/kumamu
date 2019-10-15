import parser from "../api/parser";

const functions = () => {
  parser.setFunction("add", async (en, args, scope) => {
    if (args.length < 2) throw new Error("#-1 ADD REQUIRES AT LEAST 2 NUMBERS");
    let count = 0;

    // loop through args, evaluate and
    for (let i = 0; i < args.length; i++) {
      count += parseInt(await parser.evaluate(en, args[i], scope));
    }
    return count.toString();
  });

  parser.setFunction("sub", async (en, args, scope) => {
    if (args.length !== 0) throw new Error("#-1 SUB REQUIRES 2 NUMBERS.");
    const num1 = parseInt(await parser.evaluate(en, args[0], scope));
    const num2 = parseInt(await parser.evaluate(en, args[1], scope));
    return (num1 - num2).toString();
  });
};

export default functions;
