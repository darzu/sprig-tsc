import ts, {
  TransformationContext,
  isBlock,
  isIdentifier,
  isSourceFile,
} from "typescript";
import { SyntaxKindName } from "./syntaxKindName.js";
import { assert } from "./util.js";
import fs from "fs";
import { mkPrinter } from "./printer.js";

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

transformFiles([PATH]);

function transformFiles(fileNames: string[]): void {
  console.log("running transform-registerSystem");

  let program = ts.createProgram(fileNames, opts);

  const diags = ts.getPreEmitDiagnostics(program);
  // if (diags.length) {
  //   console.log("pre-emit errors:");
  //   for (let d of diags) {
  //     console.log(ts.flattenDiagnosticMessageText(d.messageText, "\n"));
  //   }
  // }

  const sourceFile = program.getSourceFile(fileNames[0])!;

  const transformerFactory = (context: TransformationContext) => {
    const transformer = (n: ts.Node): ts.Node => {
      // if (ts.isMemberName(n) && n.text === "registerSystem") {
      //   let newN = ts.factory.createIdentifier(n.text + "2");
      //   return newN;
      // }

      if (ts.isCallExpression(n)) {
        // console.log(`isCallExpression, e.: ${SyntaxKindName[e.expression.kind]}`);
        const propExp = n.expression;
        if (ts.isPropertyAccessExpression(propExp)) {
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
              const fnArg = n.arguments[0];
              // const fnType = e.typeArguments![0];
              const nameArg = n.arguments[1];
              // const nameType = e.typeArguments![1];
              const newCall = ts.factory.createCallExpression(
                newProp,
                // [nameType, fnType],
                [],
                [nameArg, fnArg]
              );
              // const newStmt = ts.factory.createExpressionStatement(newCall);
              return newCall; // TODO(@darzu): does this break the transformer recursion?
            }
          }
        }
      }
      return ts.visitEachChild(n, transformer, context);
    };
    return transformer;
  };

  const transformed = ts.transform(sourceFile, [transformerFactory]);

  assert(transformed.transformed.length);
  let newFile = transformed.transformed[0] as ts.SourceFile;

  const printer = mkPrinter();

  console.log("writting..");
  const newFileStr = printer.emitFile(newFile).join("\n");

  // console.log(emit(newFile));
  fs.writeFile(PATH_OUT, newFileStr, (err) => {
    if (err) {
      console.error("WRITE ERROR:");
      console.error(err?.message);
    }
  });
}
