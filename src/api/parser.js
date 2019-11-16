const { readFileSync } = require("fs");
const { resolve } = require("path");
const { getFiles } = require("../utils/utilities");
const peg = require("pegjs");

class Parser {
  constructor() {
    this.peg = readFileSync(resolve(__dirname, "../mushcode.pegjs"), {
      encoding: "utf8"
    });
    this.parser = peg.generate(this.peg);
    this.functions = new Map();
    this.sub = new Map();
  }

  async init() {
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
    let results = typeof text === "string" ? text : text.string;
    for (let [k, v] of entries) {
      results = results.replace(k, v);
    }
    return results;
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
          output = output.replace(new RegExp(key, "gi"), scope[key]);
        }
        return output;
      }
    } else if (expr.type === "function") {
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

  async run(en, string, scope, parse = true) {
    if (parse)
      string = string.replace(/%[(]/g, "\u250D").replace(/%[)]/g, "\u2511");
    try {
      return {
        results: await this.evaluate(en, this.parse(string), scope),
        error: undefined
      };
    } catch (error) {
      return {
        results: undefined,
        error
      };
    }
  }

  async string(en, text, scope) {
    let parens = -1;
    let brackets = -1;
    let match = false;
    let workStr = "";
    let output = "";
    let start = -1;
    let end = -1;

    // Loop through the text looking for brackets.
    for (let i = 0; i < text.length; i++) {
      if (text[i] === "[") {
        brackets = brackets > 0 ? brackets + 1 : 1;
        start = start > 0 ? start : i;
        match = true;
      } else if (text[i] === "]") {
        brackets = brackets - 1;
      } else if (text[i] === "(") {
        parens = parens > 0 ? parens + 1 : 1;
      } else if (text[i] === ")") {
        parens = parens - 1;
      }

      // Check to see if the brackets are evenly matched.  If so
      // process that portion of the string and replace it.
      if (match && brackets !== 0 && parens !== 0) {
        workStr += text[i];
      } else if (match && brackets === 0 && parens === 0) {
        // If the brackets are zeroed out, replace the portion of
        // the string with evaluated code.
        workStr += text[i];
        end = i;
        if (end) {
          let results = await this.run(en, workStr, scope, false);
          let { results: res, error } = results;
          if (error) {
            output += await this.string(en, workStr, scope).catch(error =>
              console.log(error)
            );
          } else {
            output += res;
          }

          // Reset the count variables
          brackets = -1;
          parens = -1;
          start = -1;
          end = -1;
          match = false;
          workStr = "";
        }
      } else {
        if (text[i].match(/[\[\]\(\)]/)) {
          workStr += text[i];
        } else {
          output += text[i];
        }
      }
    }

    // Return the evaluated text.
    return output ? output : workStr;
  }
}

module.exports = new Parser();
