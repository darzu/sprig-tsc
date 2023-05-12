import ts, {
  TransformationContext,
  isBlock,
  isIdentifier,
  isSourceFile,
} from "typescript";
import { SyntaxKindName } from "./syntaxKindName.js";
import { assert, parseJsonWithComments } from "./util.js";
import { promises as fs } from "fs";
import { mkPrinter } from "./printer.js";
import { createCompilerHost } from "./host.js";

// TODO(@darzu): read these from tsconfig
const defaultOpts: ts.CompilerOptions = {
  noEmitOnError: true,
  noImplicitAny: true,
  target: ts.ScriptTarget.ES2020,
  module: ts.ModuleKind.ES2022,
};

const SAMPLES_PATH = "/Users/darzu/projects/sprig-tsc/samples";
const SPRIG_PATH = "/Users/darzu/sprig";
const SPRIG_TSCONFIG_PATH = `${SPRIG_PATH}/tsconfig.json`;

const PATH = `${SAMPLES_PATH}/em-user.ts`;
const PATH_OUT = `${SAMPLES_PATH}/em-user_T.ts`;
// const PATH = `/Users/darzu/sprig/src/ld53/score.ts`;
// const PATH_OUT = `/Users/darzu/sprig/src/ld53/score_T.ts`;

// transformFiles([PATH]);

transformFiles();

async function transformFiles() {
  console.log("running transform-registerSystem");

  // _test_combinePath();
  // return;

  const tsconfigStr = await fs.readFile(SPRIG_TSCONFIG_PATH, {
    encoding: "utf-8",
  });
  // const tsconfig = ts.readJsonConfigFile(
  //   SPRIG_TSCONFIG_PATH,
  //   () => tsconfigStr
  // );
  const tsconfig = parseJsonWithComments(tsconfigStr);
  const compilerOpts: ts.CompilerOptions =
    tsconfig.compilerOptions as ts.CompilerOptions;

  // HACKy path fixing b/c we need the tsconfig it be in absolute paths
  const mkPathAbsolute = (path: string) => {
    assert(path.startsWith("./"));
    return SPRIG_PATH + "/" + path.slice(2);
  };
  // compilerOpts.outDir = mkPathAbsolute(compilerOpts.outDir!);
  // compilerOpts.rootDir = mkPathAbsolute(compilerOpts.rootDir!);
  // compilerOpts.typeRoots = compilerOpts.typeRoots!.map(mkPathAbsolute);

  // compilerOpts.baseUrl

  const host_ts = ts.createCompilerHost(compilerOpts);
  const host = createCompilerHost(SPRIG_PATH);

  // tsconfig.

  // const fileNames = [`/Users/darzu/sprig/src/ld53/score.ts`];
  const fileNames = [`./src/ld53/score.ts`];

  let program = ts.createProgram(fileNames, compilerOpts, host);

  // return;

  const diags = ts.getPreEmitDiagnostics(program);
  let diags2 = diags.filter((d) => !!d.file);
  if (diags.length) {
    console.log("pre-emit errors:");
    for (let d of diags) {
      console.log(ts.flattenDiagnosticMessageText(d.messageText, "\n"));
    }
  }

  return;

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

              const fnArg = n.arguments[2];
              // const fnType = e.typeArguments![0];
              const nameArg = n.arguments[3];
              // const nameType = e.typeArguments![1];
              const newCall = ts.factory.createCallExpression(
                newProp,
                // [nameType, fnType],
                [],
                [nameArg, n.arguments[0], n.arguments[1], fnArg]
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
  await fs.writeFile(PATH_OUT, newFileStr);
  // , (err) => {
  //   if (err) {
  //     console.error("WRITE ERROR:");
  //     console.error(err?.message);
  //   }
  // });
}
