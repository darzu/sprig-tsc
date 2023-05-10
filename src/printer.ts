import ts from "typescript";
import { SyntaxKindName } from "./syntaxKindName.js";
import { assert, flatten } from "./util.js";

export function mkPrinter() {
  return {
    emitFile,
  };
}

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
function emitStmt(n: ts.Statement): string[] {
  if (isUnchanged(n)) return [emitOld(n)];
  if (ts.isIfStatement(n)) {
    let cond = emitExp(n.expression);
    let body = emitStmt(n.thenStatement);
    return [`if (${cond})`, ...body];
  } else if (ts.isFunctionDeclaration(n)) {
    const mods = ""; // TODO(@darzu): IMPL! export, async, etc
    const name = emitIdentifier(n.name);
    const params = n.parameters.map(emitParameter);
    assert(n.body, `TODO: impl fn without body?`);
    const body = emitBlock(n.body!);
    return [`${mods}function ${name}(${params.join(", ")})`, ...body];
  } else if (ts.isExpressionStatement(n)) {
    return [emitExp(n.expression)];
  } else if (ts.isBlock(n)) {
    return emitBlock(n);
  } else {
    throw `Unknown stmt kind: ${SyntaxKindName[n.kind]}`;
  }
}
function emitBlock(n: ts.Block): string[] {
  if (isUnchanged(n)) return [emitOld(n)];
  return ["{", ...n.statements.flatMap((n2) => emitStmt(n2)), "}"];
}
function emitParameter(n: ts.ParameterDeclaration): string {
  if (isUnchanged(n)) return emitOld(n);
  throw `TODO: emitParameter`;
}
function emitExp(n: ts.Expression): string {
  if (isUnchanged(n)) return emitOld(n);
  if (ts.isCallExpression(n)) {
    const fn = emitExp(n.expression);
    const args = n.arguments.map(emitExp);
    return `${fn}(${args.join(", ")})`;
  } else if (ts.isPropertyAccessExpression(n)) {
    const obj = emitExp(n.expression);
    return `${obj}.${n.name.text}`;
  } else {
    throw `Unknown exp kind: ${SyntaxKindName[n.kind]}`;
  }
}
function emitOld(n: ts.Node): string {
  return n.getFullText();
}

function isUnchanged(n: ts.Node): boolean {
  return !isNew(n) && !isUpdated(n);
}
function isNew(n: ts.Node): boolean {
  return n.pos === -1;
}
function isUpdated(n: ts.Node): boolean {
  return !!(n as any).original;
}
