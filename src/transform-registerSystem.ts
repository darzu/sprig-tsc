import ts from "typescript";
import { SyntaxKindName } from "./syntaxKindName.js";
import { assert } from "./util.js";
import fs from "fs";

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

  const printer = ts.createPrinter({
    removeComments: false,
    newLine: ts.NewLineKind.LineFeed,
  });

  // for (let e of sourceFile.getChildren()) {
  //   visitSourceFile(e);
  // }
  const newFileStr = visitSourceFile(sourceFile);

  // ts.forEachChild(sourceFile, (node) => {
  //   // console.log(`kind: ${SyntaxKindName[node.kind]}`);
  //   // if (ts.isstatement
  //   if (ts.isCallExpression(node)) {
  //     console.log(`calling: ${emit(node)}`);
  //   }
  // });

  // const newFileStr = printer.printNode(
  //   ts.EmitHint.SourceFile,
  //   newFile,
  //   newFile
  // );

  // console.log(newFileStr);

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
    const newStmts = syntaxList._children.map((e) => {
      if (ts_isStatement(e)) {
        return visitStmt(e);
      } else {
        console.log(`unknown node ${SyntaxKindName[e.kind]}`);
        return e as ts.Statement;
      }
    });
    // const stmts = e.statements;
    // const newStmts = stmts.map((s) => visitStmt(s));
    // const newFile = ts.factory.createSourceFile(
    //   newStmts,
    //   e.endOfFileToken,
    //   e.flags
    // );
    // return newStmts.join("\n");
    // TODO(@darzu): difference between update and create?
    // const newFile = ts.factory.updateSourceFile(sourceFile, newStmts);
    return newStmts
      .map((s) => printer.printNode(ts.EmitHint.Unspecified, s, sourceFile))
      .join("\n");
    // return printer.printNode(ts.EmitHint.Unspecified, newFile, sourceFile);
    // return e;

    // let res = "";
    // let foo = sourceFile.getLineStarts();

    // for (let s of newStmts) {
    //   let triviaNum = s.getLeadingTriviaWidth(sourceFile);
    //   let start = s.getStart(sourceFile);
    //   const preLn = sourceFile.getLineAndCharacterOfPosition(start).line;
    //   let first = s.getFirstToken(sourceFile);
    //   if (first) {
    //     const stmtLn = sourceFile.getLineAndCharacterOfPosition(
    //       first.getStart()
    //     );
    //     console.log("foo");
    //   }
    //   // res +=
    // }
    // return res;
  }

  function visitStmt(e: ts.Statement): ts.Statement {
    // console.log(`visiting ${SyntaxKindName[e.kind]}`);
    if (ts_isDeclaration(e)) {
      if (ts.isFunctionDeclaration(e)) {
        if (e.body) {
          const newStmts = e.body.statements.map((s) => visitStmt(s));
          // TODO(@darzu): handle modifiers
          // return (
          //   `function ${e.name!}` +
          //   `(${e.parameters.map((p) => p.getFullText()).join(",")}) {\n` +
          //   `  ${newStmts.join("\n")}` +
          //   `\n}\n`
          // );
          return e;
        }
      }
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
              // const newStmt = ts.factory.createExpressionStatement(newCall);
              const newStmt = ts.factory.updateExpressionStatement(e, newCall);
              // console.log(newCall.getFullText());
              // const newStmt = ts.factory.createExpressionStatement(newCall);
              // console.log("found reg sys");
              // console.log(
              //   );
              // return printer.printNode(
              //   ts.EmitHint.Unspecified,
              //   newStmt,
              //   sourceFile
              // );
              return newStmt;
              // return newStmt;
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
    // const leading = e.getLeadingTriviaWidth();
    // console.log(e.getFullText());
    // return e.getFullText();
    // return printer.printNode(ts.EmitHint.Unspecified, e, sourceFile);
    // ts.getCommentRange(
    console.log(`trivia: ${e.getLeadingTriviaWidth()}`);
    // ts.couldStartTrivia
    // ts.isWhiteSpaceSingleLine
    return e;
    // return e;
  }
  function visitExp(e: ts.Expression) {
    if (ts.isCallExpression(e)) {
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
