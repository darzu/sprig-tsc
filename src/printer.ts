import ts from "typescript";
import { SyntaxKindName } from "./syntaxKindName.js";
import { assert, flatten, range } from "./util.js";

export function mkPrinter() {
  let _indent = 0;
  return {
    emitFile,
  };

  function emitFile(n: ts.SourceFile): string[] {
    if (isUnchanged(n)) return [emitOld(n)];
    let res: string[] = [];
    for (let stmt of n.statements) {
      for (let ln of emitStmt(stmt)) res.push(ln);
    }
    return res;
  }
  function emitIdentifier(n?: ts.Identifier): string {
    // TODO(@darzu): ever need to do something more complex?
    return n?.text ?? "";
  }
  function getOriginalTrivia(n: ts.Node): string {
    if (isUpdated(n)) {
      let t = n.original
        .getFullText()
        .slice(0, n.original.getLeadingTriviaWidth());
      if (t.startsWith("\n")) t = t.slice(1);
      return t;
    }
    return "";
  }
  function emitStmt(n: ts.Statement): string[] {
    if (isUnchanged(n)) return [emitOld(n)];
    if (ts.isIfStatement(n)) {
      const trivia = getOriginalTrivia(n);
      const cond = emitExp(n.expression);
      const body = emitStmt(n.thenStatement);
      return [trivia + indent(`if (${cond})`), ...body];
    } else if (ts.isFunctionDeclaration(n)) {
      const trivia = getOriginalTrivia(n);
      const mods = ""; // TODO(@darzu): IMPL! export, async, etc
      const name = emitIdentifier(n.name);
      const params = n.parameters.map(emitParameter);
      assert(n.body, `TODO: impl fn without body?`);
      const body = emitBlock(n.body!);
      return [
        trivia + indent(`${mods}function ${name}(${params.join(", ")})`),
        ...body,
      ];
    } else if (ts.isExpressionStatement(n)) {
      return [emitExp(n.expression)];
    } else if (ts.isBlock(n)) {
      return [...emitBlock(n)];
    } else {
      throw `Unknown stmt kind: ${SyntaxKindName[n.kind]}`;
    }
  }
  function emitBlock(n: ts.Block): string[] {
    if (isUnchanged(n)) return [emitOld(n)];
    const trivia = getOriginalTrivia(n);
    _indent++;
    let stmts = n.statements.flatMap((n2) => emitStmt(n2));
    _indent--;
    return [trivia + indent("{"), ...stmts, indent("}")];
  }
  function emitParameter(n: ts.ParameterDeclaration): string {
    if (isUnchanged(n)) return emitOld(n);
    throw `TODO: emitParameter`;
  }
  function emitExp(n: ts.Expression): string {
    if (isUnchanged(n)) return emitOld(n);
    if (ts.isCallExpression(n)) {
      const fn = emitExp(n.expression); // fn has trivia
      const args = n.arguments.map(emitExp);
      return `${fn}(${args.join(", ")})`;
    } else if (ts.isPropertyAccessExpression(n)) {
      const obj = emitExp(n.expression); // obj has trivia
      return `${obj}.${n.name.text}`;
    } else {
      throw `Unknown exp kind: ${SyntaxKindName[n.kind]}`;
    }
  }
  function emitOld(n: ts.Node): string {
    let r = n.getFullText();
    if (r.startsWith("\n")) r = r.slice(1);
    // console.log(JSON.stringify(r));
    return r;
  }
  function indent(s: string): string {
    return _identStrs[_indent] + s;
  }
}

var _identStrs = range(10).map((i) => "  ".repeat(i));

interface UpdatedNode extends ts.Node {
  original: ts.Node;
}

function isUnchanged(n: ts.Node): boolean {
  return !isNew(n) && !isUpdated(n);
}
function isNew(n: ts.Node): boolean {
  return n.pos === -1;
}
function isUpdated(n: ts.Node): n is UpdatedNode {
  return !!(n as any).original;
}
