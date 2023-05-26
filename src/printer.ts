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

function emitFile(n: ts.SourceFile): string {
  if (isUnchanged(n)) return emitOld(n);
  const stmts = emitStmtList(n.statements);
  const trailing = getBlockTrailing(n);
  return `${stmts}${trailing}`;
}
function emitIdentifier(n?: ts.Identifier): string {
  // TODO(@darzu): ever need to do something more complex?
  return n?.text ?? "";
}
function getLeadingTrivia(n: ts.Node): string {
  if (isUpdated(n)) {
    let t = n.original
      .getFullText()
      .slice(0, n.original.getLeadingTriviaWidth());
    // if (t.startsWith("\n")) t = t.slice(1);
    return t;
  } else {
    return "\n";
  }
}
function getBlockTrailing(n: ts.Block | ts.SourceFile): string {
  if (isUpdated(n)) {
    const orig = n.original.getFullText();
    const lastStmtEnd = n.statements[n.statements.length - 1].end;
    const trailingWidth = n.end - lastStmtEnd;
    const trailing = orig.slice(orig.length - trailingWidth);
    return trailing;
  } else {
    return "";
  }
}
const tsKeywordToStr: Partial<Record<ts.SyntaxKind, string>> = {
  [ts.SyntaxKind.ExportKeyword]: "export",
  [ts.SyntaxKind.AsyncKeyword]: "async",
};
function emitMod(m: ts.Modifier): string {
  assert(m.kind in tsKeywordToStr, `TODO: emitMod ${SyntaxKindName[m.kind]}`);
  return tsKeywordToStr[m.kind]!;
}
function emitStmt(n: ts.Statement): string {
  if (isUnchanged(n)) return emitOld(n);
  if (ts.isIfStatement(n)) {
    const cond = emitExp(n.expression);
    const body = emitStmt(n.thenStatement);
    return getLeadingTrivia(n) + `if (${cond})${body}`;
  } else if (ts.isFunctionDeclaration(n)) {
    let mods: string[] = [];
    if (n.modifiers) {
      for (let m of n.modifiers) {
        assert(ts.isModifier(m), `TODO: impl decoraters`);
        mods.push(emitMod(m));
      }
    }
    const modStr = mods.join(" ") + (mods.length ? " " : "");
    let typeParamsStr = "";
    if (n.typeParameters) {
      const typeParams: string[] = [];
      for (let t of n.typeParameters) {
        assert(isUnchanged(t), `TODO: impl changing type parameters`);
        typeParams.push(t.getFullText());
      }
      typeParamsStr = `<${typeParams.join(",")}>`;
    }
    const name = emitIdentifier(n.name);
    const params = n.parameters.map(emitParameter);
    assert(n.body, `TODO: impl fn without body?`);
    const body = emitBlock(n.body!);
    let typeStr = "";
    if (n.type) typeStr = ":" + n.type.getFullText();
    const leading = getLeadingTrivia(n);
    const paramsStr = params.join(",");
    return `${leading}${modStr}function ${name}${typeParamsStr}(${paramsStr})${typeStr}${body}`;
  } else if (ts.isExpressionStatement(n)) {
    const exp = emitExp(n.expression);
    return `${exp};`;
  } else if (ts.isBlock(n)) {
    return emitBlock(n);
  } else if (ts.isImportDeclaration(n)) {
    assert(!n.modifiers, `TODO: import modifiers`);
    assert(!n.assertClause, `TODO: import assert clause`);
    assert(
      n.importClause && isUnchanged(n.importClause),
      `TODO: import clause`
    );
    assert(
      ts.isStringLiteral(n.moduleSpecifier),
      `TODO: fancy module specifier`
    );
    const leading = getLeadingTrivia(n);
    return `${leading}import${n.importClause.getFullText()} from "${
      n.moduleSpecifier.text
    }";`;
  } else {
    throw new Error(`Unknown stmt kind: ${SyntaxKindName[n.kind]}`);
  }
}
function emitStmtList(ns: ts.NodeArray<ts.Statement>): string {
  if (ns.length === 0) return "";
  let res = "";
  for (let n of ns) {
    res += emitStmt(n);
  }
  return res;
}
function emitBlock(n: ts.Block): string {
  if (isUnchanged(n)) return emitOld(n);
  const leadingTrivia = getLeadingTrivia(n);
  let stmts = emitStmtList(n.statements);
  const trailing = getBlockTrailing(n);
  return leadingTrivia + "{" + stmts + trailing;
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
    return `${fn}(${args.join(",")})`;
  } else if (ts.isIdentifier(n)) {
    return n.text;
  } else if (ts.isPropertyAccessExpression(n)) {
    const obj = emitExp(n.expression); // obj has the trivia
    return `${obj}.${n.name.text}`;
  } else if (ts.isArrowFunction(n)) {
    const trivia = getLeadingTrivia(n);
    assert(!n.modifiers, `TODO: impl arrow fn mods`);
    const params = n.parameters.map(emitParameter);
    assert(n.body, `TODO: impl fn without body?`);
    let body: string;
    if (ts.isBlock(n.body)) body = emitBlock(n.body);
    else body = emitExp(n.body);
    return `${trivia}(${params.join(",")}) =>${body}`;
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
