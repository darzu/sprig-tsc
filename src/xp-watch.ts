import ts from "typescript";
import { registerSystemTransformer } from "./transform-registerSystem.js";
import { assert } from "./util.js";
import { mkPrinter } from "./printer.js";
import { promises as fs } from "fs";

const SPRIG_PATH = "/Users/darzu/sprig";
const THIS_PATH = "/Users/darzu/projects/sprig-tsc";

const formatHost: ts.FormatDiagnosticsHost = {
  getCanonicalFileName: (path) => path,
  getCurrentDirectory: ts.sys.getCurrentDirectory,
  getNewLine: () => ts.sys.newLine,
};

async function watchMain() {
  const configPath = ts.findConfigFile(
    /*searchPath*/ SPRIG_PATH,
    // /*searchPath*/ THIS_PATH,
    ts.sys.fileExists,
    "tsconfig.json"
  );
  if (!configPath) {
    throw new Error("Could not find a valid 'tsconfig.json'.");
  }

  // TypeScript can use several different program creation "strategies":
  //  * ts.createEmitAndSemanticDiagnosticsBuilderProgram,
  //  * ts.createSemanticDiagnosticsBuilderProgram
  //  * ts.createAbstractBuilder
  // The first two produce "builder programs". These use an incremental strategy
  // to only re-check and emit files whose contents may have changed, or whose
  // dependencies may have changes which may impact change the result of prior
  // type-check and emit.
  // The last uses an ordinary program which does a full type check after every
  // change.
  // Between `createEmitAndSemanticDiagnosticsBuilderProgram` and
  // `createSemanticDiagnosticsBuilderProgram`, the only difference is emit.
  // For pure type-checking scenarios, or when another tool/process handles emit,
  // using `createSemanticDiagnosticsBuilderProgram` may be more desirable.
  const createProgram = ts.createSemanticDiagnosticsBuilderProgram;

  // Note that there is another overload for `createWatchCompilerHost` that takes
  // a set of root files.
  const host = ts.createWatchCompilerHost(
    configPath,
    {},
    ts.sys,
    createProgram,
    function reportDiagnostic(diagnostic: ts.Diagnostic) {
      console.error(
        "Error",
        diagnostic.code,
        ":",
        ts.flattenDiagnosticMessageText(
          diagnostic.messageText,
          formatHost.getNewLine()
        )
      );
    },
    function reportWatchStatusChanged(diagnostic: ts.Diagnostic) {
      console.info(ts.formatDiagnostic(diagnostic, formatHost));
    }
  );

  // You can technically override any given hook on the host, though you probably
  // don't need to.
  // Note that we're assuming `origCreateProgram` and `origPostProgramCreate`
  // doesn't use `this` at all.
  const origCreateProgram = host.createProgram;
  host.createProgram = (
    rootNames: ReadonlyArray<string> | undefined,
    options,
    host,
    oldProgram
  ) => {
    console.log("** We're about to create the program! **");
    return origCreateProgram(rootNames, options, host, oldProgram);
  };
  const origPostProgramCreate = host.afterProgramCreate;

  host.afterProgramCreate = (program) => {
    console.log("** We finished making the program! **");
    origPostProgramCreate!(program);
  };

  // `createWatchProgram` creates an initial program, watches files, and updates
  // the program over time.
  const watcher = ts.createWatchProgram(host);

  console.log("WATCHER PROG:");
  const program = watcher.getProgram().getProgram();

  const diags = ts.getPreEmitDiagnostics(program);
  if (diags.length) {
    const max = 200;
    console.log(
      `pre-emit errors (${Math.min(diags.length, max)}/${diags.length}):`
    );
    for (let d of diags.slice(0, max)) {
      console.log(ts.flattenDiagnosticMessageText(d.messageText, "\n"));
    }
    throw "errors";
  }

  const sourceFiles = [...program.getSourceFiles()].filter(
    (f) => !f.fileName.endsWith(".d.ts")
    // && f.fileName.includes("sprig/src/")
  );
  // .slice(0, 10);

  const transformerFactory = registerSystemTransformer;
  const transformed = ts.transform(sourceFiles, [transformerFactory]);

  const program2 = watcher.getProgram().getProgram();

  const diags2 = ts.getPreEmitDiagnostics(program2);
  if (diags2.length) {
    throw "errors";
  }

  assert(transformed.transformed.length);
  // let newFile = transformed.transformed[0] as ts.SourceFile;

  const printer = mkPrinter();

  console.log("writting..");
  let numUpdated = 0;
  for (let i = 0; i < sourceFiles.length; i++) {
    const oldFile = sourceFiles[i];
    const newFile = transformed.transformed[i] as ts.SourceFile;
    const newFileStr = printer.emitFile(newFile).join("\n");
    if (newFileStr !== oldFile.getFullText()) {
      console.log(`updating ${newFile.fileName}`);
      await fs.writeFile(newFile.fileName, newFileStr);
      numUpdated++;
      if (numUpdated > 0) {
        break;
      }
    }
  }

  watcher.close();
}

watchMain();
