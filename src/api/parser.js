const { readFileSync } = require("fs");
const { resolve } = require("path");
const { getFiles } = require("../utils/utilities");
const peg = require("pegjs");

export class Parser {
  constructor() {
    this.peg = readFileSync(resolve(__dirname, "../mushcode.pegjs"), {
      encoding: "utf8"
    });
    this.parser = peg.generate(this.peg);
    this.functions = new Map();
    this.sub = new Map();
    this.init();
  }

  async init() {
    getFiles("../functions/", async (path, file) => {
      const mod = await import(path + file.name).catch(error =>
        console.log(error)
      );
      await mod.default();
    });

    // import substitutions.
    require("../utils/subs")(this);
  }

  /**
   * Parse a string for syntax.
   * @param code Code string to parse for syntax
   */
  parse(code) {
    return this.parser.parse(code);
  }

  /**
   * Generate the parser when the mushcode.pegjs file is
   * changed.
   */
  generate() {
    this.parser = peg.generate(this.peg);
  }

  /**
   * Add a function to the global function system.
   * @param name The name of the function.
   * @param func The function to be executed when the function
   * name is matched.
   */
  setFunction(name, func) {
    if (func.length === 3) {
      this.functions.set(name.toLowerCase(), func);
    } else {
      throw new Error("setFunction accepts functions with 3 args.");
    }
  }

  subs(text) {
    const entries = Array.from(this.sub.entries());
    for (let [k, v] of entries) {
      text = text.replace(k, v);
    }
    return text;
  }

  /**
   * Evaluate an AST for words, functions and lists.
   * @param en The function enactor
   * @param expr The expression to evaluate.
   * @param scope The scope of the expression where functions and
   * special forms are stored.
   */
  async evaluate(en, expr, scope) {
    if (expr.type === "word") {
      if (scope[expr.value]) {
        return scope[expr.value];
      } else {
        let output = expr.value;
        for (const key in scope) {
          output = output.replace(new RegExp(key + "$", "gi"), scope[key]);
        }
        return output;
      }
    } else if ((expr.type = "function")) {
      const operator = expr.operator;
      if (operator.type === "word" && this.functions.has(operator.value)) {
        return await this.functions.get(operator.value)(en, expr.args, scope);
      }
    } else if (expr.type === "list") {
      let output = "";
      for (let i = 0; i < expr.value.length; i++) {
        output += await this.evaluate(en, expr.value[i], scope);
      }

      return output;
    } else {
      throw new Error("Unknown Expression: ");
    }
  }

  /**
   * Strip color substitutions from an input string.
   * @param string The string to remove the ansi subsitutions from.
   */
  stripSubs(string) {
    return string.replace(/%[cCxX]./g, "");
  }

  async run(en, string, scope) {
    string = string.replace(/%[(]/g, "\u250D").replace(/%[)]/g, "\u2511");
    return await this.evaluate(en, this.parse(string), scope).catch(error =>
      console.log(error)
    );
  }
}

export default new Parser();
