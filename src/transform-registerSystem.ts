import ts from "typescript";
import { SyntaxKindName } from "./syntaxKindName.js";

const opts: ts.CompilerOptions = {
  noEmitOnError: true,
  noImplicitAny: true,
  target: ts.ScriptTarget.ES5,
  module: ts.ModuleKind.ES2022,
};

transform(["../samples/em-user.ts"]);

function transform(fileNames: string[]): void {
  console.log("running transform-registerSystem");

  let program = ts.createProgram(fileNames, opts);

  const sourceFile = program.getSourceFile(fileNames[0])!;

  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

  for (let e of sourceFile.getChildren()) {
    visitNode(e);
  }

  // ts.forEachChild(sourceFile, (node) => {
  //   // console.log(`kind: ${SyntaxKindName[node.kind]}`);
  //   // if (ts.isstatement
  //   if (ts.isCallExpression(node)) {
  //     console.log(`calling: ${emit(node)}`);
  //   }
  // });

  function emit(n: ts.Node) {
    return printer.printNode(ts.EmitHint.Unspecified, n, sourceFile);
  }

  function visitNode(e: ts.Node) {
    if (ts_isSyntaxList(e)) {
      for (let e2 of e._children) {
        visitNode(e2);
      }
    } else if (e.kind === ts.SyntaxKind.EndOfFileToken) {
      // nop
    } else if (ts_isStatement(e)) {
      visitStmt(e);
    } else {
      console.warn(`unknown Node kind: ${SyntaxKindName[e.kind]}`);
    }
  }

  function visitStmt(e: ts.Statement) {
    if (ts_isDeclaration(e)) {
      // nop
    } else if (ts.isExpressionStatement(e)) {
      visitExp(e.expression);
    } else {
      console.warn(`unknown Statement kind: ${SyntaxKindName[e.kind]}`);
    }
  }
  function visitExp(e: ts.Expression) {
    if (ts.isCallExpression(e)) {
      const e2 = e.expression;
      if (ts.isPropertyAccessExpression(e2)) {
        const member = e2.name;
        const e3 = e2.expression;
        if (ts.isIdentifier(e3)) {
          if (e3.text === "EM" && member.text === "registerSystem") {
            console.log("found reg sys");
            const fnArg = e.arguments[0];
            // const fnType = e.typeArguments![0];
            const nameArg = e.arguments[1];
            // const nameType = e.typeArguments![1];
            const newCall = ts.factory.createCallExpression(
              e2,
              // [nameType, fnType],
              [],
              [nameArg, fnArg]
            );

            console.log(
              printer.printNode(ts.EmitHint.Unspecified, newCall, sourceFile)
            );
          }
        }
      }
      // visitExp(e.expression);
    } else {
      console.warn(`unknown Expression kind: ${SyntaxKindName[e.kind]}`);
    }
  }
}

// TODO(@darzu): Move these into TypeScript?
function ts_isDeclaration(e: ts.Node): e is ts.Declaration {
  return (
    e.kind === ts.SyntaxKind.ImportDeclaration
    // TODO(@darzu): add more kinds
  );
}
function ts_isStatement(e: ts.Node): e is ts.Statement {
  // TODO(@darzu): annoying this doesn't exist already
  return (
    e.kind === ts.SyntaxKind.ImportDeclaration ||
    e.kind === ts.SyntaxKind.ExpressionStatement
    // TODO(@darzu): add more kinds
  );
}
function ts_isSyntaxList(e: ts.Node): e is ts.SyntaxList {
  return e.kind === ts.SyntaxKind.SyntaxList;
}

// ts.SyntaxKind.statement
