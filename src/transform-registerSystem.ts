import ts from "typescript";
import { SyntaxKindName } from "./syntaxKindName.js";
import { assert } from "./util.js";
import fs from "fs";

// TODO(@darzu): read these from tsconfig
const opts: ts.CompilerOptions = {
  noEmitOnError: true,
  noImplicitAny: true,
  target: ts.ScriptTarget.ES2020,
  module: ts.ModuleKind.ES2022,
};

const SAMPLES_PATH = "/Users/darzu/projects/sprig-tsc/samples";

const PATH = `${SAMPLES_PATH}/em-user.ts`;
const PATH_OUT = `${SAMPLES_PATH}/em-user_T.ts`;

transform([PATH]);

function transform(fileNames: string[]): void {
  console.log("running transform-registerSystem 3");

  let program = ts.createProgram(fileNames, opts);

  const diags = ts.getPreEmitDiagnostics(program);
  for (let d of diags) {
    console.log(ts.flattenDiagnosticMessageText(d.messageText, "\n"));
  }

  const sourceFile = program.getSourceFile(fileNames[0])!;

  // TODO(@darzu): remove!
  const printer = ts.createPrinter({
    removeComments: true,
    newLine: ts.NewLineKind.LineFeed,
    noEmitHelpers: true,
  });

  const newFileStr = visitSourceFile(sourceFile);

  // console.log(emit(newFile));
  fs.writeFile(PATH_OUT, newFileStr, (err) => {
    console.error(err?.message);
  });

  // function emit(n: ts.Node) {
  //   return printer.printNode(ts.EmitHint.Unspecified, n, sourceFile);
  // }

  function visitSourceFile(e: ts.SourceFile): string {
    let children = e.getChildren();
    assert(children.length === 2);
    const [syntaxList, endOfFileToken] = children;
    assert(ts_isSyntaxList(syntaxList));
    assert(endOfFileToken.kind === ts.SyntaxKind.EndOfFileToken);

    let oldTxt = e.text;

    let res = "";

    syntaxList._children.forEach((oldStmt) => {
      if (ts_isStatement(oldStmt)) {
        let oldFullStart = oldStmt.pos;
        let oldStart = oldStmt.getStart(e);
        let prelude = oldTxt.substring(oldFullStart, oldStart);
        let newStmt = visitStmt(oldStmt);

        // new stmt
        // if (newStmt.pos < 0)
        res += prelude;
        res += printer.printNode(ts.EmitHint.Unspecified, newStmt, e);
        // res += newStmt.getText();
      } else {
        console.warn(`unknown node ${SyntaxKindName[oldStmt.kind]}`);
        // return e as ts.Statement;
      }
    });

    return res;
  }

  function visitStmt(e: ts.Statement): ts.Statement {
    // console.log(`visiting ${SyntaxKindName[e.kind]}`);
    if (ts_isDeclaration(e)) {
      // if (ts.isFunctionDeclaration(e)) {
      //   if (e.body) {
      //     const newStmts = e.body.statements.map((s) => visitStmt(s));
      //     // TODO(@darzu): handle modifiers
      //     // return (
      //     //   `function ${e.name!}` +
      //     //   `(${e.parameters.map((p) => p.getFullText()).join(",")}) {\n` +
      //     //   `  ${newStmts.join("\n")}` +
      //     //   `\n}\n`
      //     // );
      //     return e;
      //   }
      // }
    } else if (ts.isExpressionStatement(e)) {
      // console.log("isExpressionStatement");
      // visitExp(e.expression);
      const callExp = e.expression;
      if (ts.isCallExpression(callExp)) {
        // console.log(`isCallExpression, e.: ${SyntaxKindName[e.expression.kind]}`);
        const propExp = callExp.expression;
        if (ts.isPropertyAccessExpression(propExp)) {
          // console.log("isPropertyAccessExpression");
          const member = propExp.name;
          const emExp = propExp.expression;
          if (ts.isIdentifier(emExp)) {
            if (
              (emExp.text === "EM" || emExp.text === "em") &&
              member.text === "registerSystem"
            ) {
              const newProp = ts.factory.createPropertyAccessExpression(
                emExp,
                "registerSystem2"
              );
              const fnArg = callExp.arguments[0];
              // const fnType = e.typeArguments![0];
              const nameArg = callExp.arguments[1];
              // const nameType = e.typeArguments![1];
              const newCall = ts.factory.createCallExpression(
                newProp,
                // [nameType, fnType],
                [],
                [nameArg, fnArg]
              );
              const newStmt = ts.factory.createExpressionStatement(newCall);
              // const newStmt = ts.factory.updateExpressionStatement(e, newCall);
              return newStmt;
              // return (
              //   `${emExp.getFullText()}.registerSystem2` +
              //   `(${nameArg.getFullText().trim()}, ${fnArg.getFullText()});`
              // );
            }
          }
        }
      }
    } else {
      // console.warn(`unknown Statement kind: ${SyntaxKindName[e.kind]}`);
    }

    return e;
    // return e;
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
    e.kind === ts.SyntaxKind.IfStatement ||
    e.kind === ts.SyntaxKind.ForStatement ||
    e.kind === ts.SyntaxKind.FunctionDeclaration ||
    e.kind === ts.SyntaxKind.ExpressionStatement
    // TODO(@darzu): add more kinds
  );
}
function ts_isSyntaxList(e: ts.Node): e is ts.SyntaxList {
  return e.kind === ts.SyntaxKind.SyntaxList;
}

// ts.SyntaxKind.statement
