import { readFileSync } from "fs";
import { resolve } from "path";
import { IDbObj } from "./db/lib/objects";

const peg = require("pegjs");

export interface Scope {
  [key: string]: any;
}

export interface Operator {
  type: string;
  value: any;
}

export interface Expr {
  type: string;
  value: any;
  operator: Operator;
  args?: string[];
}
class Parser {
  private peg: any;
  private parser: any;
  private functions: Map<
    string,
    (en: IDbObj, args: Expr[], scope: Scope) => void
  >;

  constructor() {
    this.peg = readFileSync(resolve(__dirname, "../mushcode.pegjs"), {
      encoding: "utf8"
    });
    this.parser = peg.generate(this.peg);
    this.functions = new Map();
  }

  /**
   * Parse a string for syntax.
   * @param code Code string to parse for syntax
   */
  public parse(code: string) {
    return this.parser.parse(code);
  }

  /**
   * Generate the parser when the mushcode.pegjs file is
   * changed.
   */
  public generate() {
    this.parser = peg.generate(this.peg);
  }

  /**
   * Add a function to the global function system.
   * @param name The name of the function.
   * @param func The function to be executed when the function
   * name is matched.
   */
  public setFunction(
    name: string,
    func: (en: IDbObj, args: Expr[], scope: Scope) => any
  ) {
    if (func.length === 3) {
      this.functions.set(name.toLowerCase(), func);
    } else {
      throw new Error("setFunction accepts functions with 3 args.");
    }
  }

  /**
   * Evaluate an AST for words, functions and lists.
   * @param en The function enactor
   * @param expr The expression to evaluate.
   * @param scope The scope of the expression where functions and
   * special forms are stored.
   */
  public async evaluate(en: IDbObj, expr: Expr, scope: Scope) {
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
      const operator: Operator = expr.operator;
      if (operator.type === "word" && this.functions.has(operator.value)) {
        return await this.functions.get(operator.value)!(en, expr.value, scope);
      }
    } else if (expr.type === "list") {
      let output = "";
      for (let i = 0; i < expr.value.length; i++) {
        output += await this.evaluate(en, expr.value[i], scope);
      }

      return output;
    }
  }

  /**
   * Strip color substitutions from an input string.
   * @param string The string to remove the ansi subsitutions from.
   */
  public stripSubs(string: string) {
    return string.replace(/%[cCxX]./g, "");
  }

  public async run(en: IDbObj, string: string, scope: Scope) {
    string = string.replace(/%[(]/g, "\u250D").replace(/%[)]/g, "\u2511");
    return await this.evaluate(en, this.parse(string), scope).catch(error =>
      console.log(error)
    );
  }
}

export default new Parser();
