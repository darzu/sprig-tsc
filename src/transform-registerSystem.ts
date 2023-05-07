import ts from "typescript";
import { SyntaxKindName } from "./syntaxKindName.js";

const opts: ts.CompilerOptions = {
  noEmitOnError: true,
  noImplicitAny: true,
  target: ts.ScriptTarget.ES5,
  module: ts.ModuleKind.ES2022,
};

compile(["../samples/em-user.ts"]);

function compile(fileNames: string[]): void {
  let program = ts.createProgram(fileNames, opts);
  const sourceFile = program.getSourceFile(fileNames[0])!;

  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

  console.log("transform-registerSystem");

  ts.forEachChild(sourceFile, (node) => {
    console.log(`kind: ${SyntaxKindName[node.kind]}`);
    if (ts.isCallExpression(node)) {
      const str = printer.printNode(ts.EmitHint.Unspecified, node, sourceFile);
      console.log(`calling: ${str}`);
    }
  });
}

// const syntaxKindToString;
