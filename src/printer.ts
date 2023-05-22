import { SyntaxKindName } from "./syntaxKindName.js";
import { assert, flatten, range } from "./util.js";
import ts from "typescript";
// import * as ts from "../../TypeScript/src/compiler/_namespaces/ts";

/* NOTES: 
  - We don't handle indentation. The format should clean that up. 
  - Our most important goal is that nothing is lost during the printing, especially comments.
    - to this end, if an ast node hasn't been updated by a refactor, we emit _exactly_ the old text
    - and if a node has been updated, we try to reuse exactly as many sub parts as we can.
  - To really handle indent right, we've basically got to duplicate the formatter.
  - A lot of this could be made more robust if we had a AST view that included comments as their own nodes.
*/

export function mkPrinter() {
  return {
    emitFile,
  };
}

function emitFile(n: ts.SourceFile): string[] {
  if (isUnchanged(n)) return [emitOld(n)];
  let res: string[] = emitStmtList(n.statements);
  return res;
}
function emitIdentifier(n?: ts.Identifier): string {
  // TODO(@darzu): ever need to do something more complex?
  return n?.text ?? "";
}
function getOriginalLeadingTrivia(n: ts.Node): string {
  if (isUpdated(n)) {
    let t = n.original
      .getFullText()
      .slice(0, n.original.getLeadingTriviaWidth());
    if (t.startsWith("\n")) t = t.slice(1);
    return t;
  }
  return "";
}
const tsKeywordToStr: Partial<Record<ts.SyntaxKind, string>> = {
  [ts.SyntaxKind.ExportKeyword]: "export",
};
function emitMod(m: ts.Modifier): string {
  assert(m.kind in tsKeywordToStr, `TODO: emitMod ${SyntaxKindName[m.kind]}`);
  return tsKeywordToStr[m.kind]!;
}
function emitStmt(n: ts.Statement): string[] {
  // TODO(@darzu): DBG
  // if (isUnchanged(n) && n.getFullText().includes("CONFIGURABLE")) {
  //   // what to do
  //   let foo = 3;
  // }
  if (isUnchanged(n)) return [emitOld(n)];
  if (ts.isIfStatement(n)) {
    const trivia = getOriginalLeadingTrivia(n);
    const cond = emitExp(n.expression);
    const body = emitStmt(n.thenStatement);
    return [trivia + `if (${cond})`, ...body];
  } else if (ts.isFunctionDeclaration(n)) {
    const trivia = getOriginalLeadingTrivia(n);
    let mods: string[] = [];
    if (n.modifiers) {
      for (let m of n.modifiers) {
        assert(ts.isModifier(m), `TODO: impl decoraters`);
        mods.push(emitMod(m));
      }
    }
    const modStr = mods.join(" ") + (mods.length ? " " : "");
    const name = emitIdentifier(n.name);
    const params = n.parameters.map(emitParameter);
    assert(n.body, `TODO: impl fn without body?`);
    const body = emitBlock(n.body!);
    return [
      trivia + `${modStr}function ${name}(${params.join(", ")})`,
      ...body,
    ];
  } else if (ts.isExpressionStatement(n)) {
    return [emitExp(n.expression)];
  } else if (ts.isBlock(n)) {
    return [...emitBlock(n)];
  } else {
    throw new Error(`Unknown stmt kind: ${SyntaxKindName[n.kind]}`);
  }
}
function emitStmtList(ns: ts.NodeArray<ts.Statement>): string[] {
  if (ns.length === 0) return [];
  let stmts: string[] = [];
  let lastEndLine = -2;
  const src = ns[0].getSourceFile();
  for (let n of ns) {
    let startLn = -1;
    let endLn = -1;
    if (isUnchanged(n)) {
      startLn = ts.getLineAndCharacterOfPosition(src, n.getFullStart()).line;
      endLn = ts.getLineAndCharacterOfPosition(src, n.getEnd()).line;
    }
    let lns = emitStmt(n);
    for (let i = 0; i < lns.length; i++) {
      if (i === 0 && startLn === lastEndLine) {
        stmts[stmts.length - 1] += lns[i];
      } else {
        stmts.push(lns[i]);
      }
    }
    lastEndLine = endLn;
  }
  return stmts;
}
function emitBlock(n: ts.Block): string[] {
  if (isUnchanged(n)) return [emitOld(n)];
  const trivia = getOriginalLeadingTrivia(n);
  let stmts = emitStmtList(n.statements);
  return [trivia + "{", ...stmts, "}"];
}
function emitParameter(n: ts.ParameterDeclaration): string {
  if (isUnchanged(n)) return emitOld(n);
  throw new Error(`TODO: emitParameter`);
}
function emitExp(n: ts.Expression): string {
  if (isUnchanged(n)) return emitOld(n);
  if (ts.isCallExpression(n)) {
    const fn = emitExp(n.expression); // fn has the trivia
    const args = n.arguments.map(emitExp);
    return `${fn}(${args.join(", ")})`;
  } else if (ts.isPropertyAccessExpression(n)) {
    const obj = emitExp(n.expression); // obj has the trivia
    return `${obj}.${n.name.text}`;
  } else if (ts.isArrowFunction(n)) {
    assert(!n.modifiers, `TODO: impl arrow fn mods`);
    const params = n.parameters.map(emitParameter);
    assert(n.body, `TODO: impl fn without body?`);
    let body: string;
    if (ts.isBlock(n.body)) body = emitBlock(n.body).join("\n");
    else body = emitExp(n.body);
    return `(${params.join(", ")}) => ${body}`;
  } else {
    throw Error(`Unknown exp kind: ${SyntaxKindName[n.kind]}`);
  }
}
function emitOld(n: ts.Node): string {
  let r = n.getFullText();
  // if (r.startsWith("\n")) r = r.slice(1);
  // console.log(JSON.stringify(r));
  return r;
}

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
