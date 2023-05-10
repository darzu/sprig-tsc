import ts, {
  TransformationContext,
  isBlock,
  isIdentifier,
  isSourceFile,
} from "typescript";
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

// REFACTORS
//  change some nodes
//    new nodes are composed of old and new nodes
//  printing:
//    if node has new children, recurse
//        if immediate parts are a mixture of old and new,
//        need to custom print them together
//    if not, copy-paste from old file

transformFiles([PATH]);

function createLanguageServiceHost(p: ts.Program): ts.LanguageServiceHost {
  return {
    readFile: (path: string, encoding?: string): string | undefined => {
      // TODO(@darzu): IMPL
      return "";
    },
    fileExists: (path: string, encoding?: string): boolean => {
      // TODO(@darzu): IMPL
      return false;
    },
    getCompilationSettings: (): ts.CompilerOptions => {
      const opts = p.getCompilerOptions();
      opts.noLib = true;
      return opts;
    },
    // getNewLine: (): string => {
    //   return "\n";
    // },

    getScriptFileNames: (): string[] => {
      return p.getSourceFiles().map((f) => f.fileName);
    },

    getScriptVersion: (fileName: string): string => {
      return "0";
    },

    getScriptSnapshot: (fileName: string): ts.IScriptSnapshot => {
      const f = p.getSourceFile(fileName)!;
      return {
        getLength: () => f.getFullText().length,
        getText: () => f.getFullText(),
        getChangeRange: () => undefined,
      };
    },

    getCurrentDirectory: (): string => {
      return ".";
    },

    getDefaultLibFileName: (options: ts.CompilerOptions): string => {
      return "";
    },

    // useCaseSensitiveFileNames: (): boolean => {
    //   return true;
    // },
  };
}

function transformFiles(fileNames: string[]): void {
  console.log("running transform-registerSystem 3");

  let program = ts.createProgram(fileNames, opts);

  const diags = ts.getPreEmitDiagnostics(program);
  for (let d of diags) {
    console.log(ts.flattenDiagnosticMessageText(d.messageText, "\n"));
  }

  const sourceFile = program.getSourceFile(fileNames[0])!;

  const lsHost = createLanguageServiceHost(program);
  const ls = ts.createLanguageService(lsHost);
  // ls.getEditsForRefactor(
  // const edits = textChanges.ChangeTracker.with(context, t => doChange(context, context.file, interactiveRefactorArguments.targetFile, context.program, statements, t, context.host, context.preferences));
  // changes.insertNodesAfter(targetFile,
  // const edits = textChanges.ChangeTracker.with(context, t => {
  //   t.replaceNode(file, func.body, body);
  // });
  // forEachLeadingCommentRange
  // FileTextChanges
  // ts.unchangedTextChangeRange
  // ts.updateSourceFile(
  // ts.getAdjustedStartPosition
  // LeadingTriviaOption
  // skipTrivia
  // type Change = ReplaceWithSingleNode | ReplaceWithMultipleNodes | RemoveNode | ChangeText;
  // FileTextChanges
  // ls.getEditsForRefactor(
  // FileTextChanges
  // ts.textChangeRangeNewSpan;
  // TextChange

  interface PrintHandlersExt extends ts.PrintHandlers {
    onEmitSourceMapOfNode?: (
      hint: ts.EmitHint,
      node: ts.Node,
      emitCallback: (hint: ts.EmitHint, node: ts.Node) => void
    ) => void;
    onEmitSourceMapOfToken?: (
      node: ts.Node | undefined,
      token: ts.SyntaxKind,
      writer: (s: string) => void,
      pos: number,
      emitCallback: (
        token: ts.SyntaxKind,
        writer: (s: string) => void,
        pos: number
      ) => number
    ) => number;
    onEmitSourceMapOfPosition?: (pos: number) => void;
    onSetSourceFile?: (node: ts.SourceFile) => void;
    onBeforeEmitNode?: (node: ts.Node | undefined) => void;
    onAfterEmitNode?: (node: ts.Node | undefined) => void;
    onBeforeEmitNodeArray?: (nodes: ts.NodeArray<any> | undefined) => void;
    onAfterEmitNodeArray?: (nodes: ts.NodeArray<any> | undefined) => void;
    onBeforeEmitToken?: (node: ts.Node) => void;
    onAfterEmitToken?: (node: ts.Node) => void;
  }

  // TODO(@darzu): NOTE, ts inner emit fn: pipelineEmitWithHintWorker

  const printHandlers: PrintHandlersExt = {
    // onEmitNode: undefined,
    onEmitNode(hint, node, emitCallback) {
      const isNew = node.pos === -1;
      const isChanged = !!(node as any).original;
      // set up or track state prior to emitting the node...
      // if (node.parent && ts.isIfStatement(node.parent))
      if (isIdentifier(node) && node.text === "registerSystem2") {
        // TODO(@darzu):
        node;
      }
      if (isSourceFile(node)) {
        node;
        // .original
        // .transformFlags
      }
      if (!isNew && !isChanged) {
        // hint = ts.EmitHint.EmbeddedStatement;
      }
      // if (node.pos >= 0) hint = ts.EmitHint.EmbeddedStatement;
      emitCallback(hint, node);
      // restore state after emitting the node...

      if (!isNew && !isChanged) {
        node;
      }
    },
    // onBeforeEmitNode: (node) => {
    //   // ts.EmitHint
    // },
    onAfterEmitNode: (node) => {
      if (node && isIdentifier(node) && node.text === "registerSystem2") {
        // TODO(@darzu):
        node;
      }
    },
    substituteNode: undefined,
  };
  // TODO(@darzu): remove!
  const printer = ts.createPrinter(
    {
      // removeComments: true,
      // removeComments: false,
      newLine: ts.NewLineKind.LineFeed,
      // noEmitHelpers: true,
      // neverAsciiEscape: true,
      preserveSourceNewlines: true,
      // terminateUnterminatedLiterals: true
    } as ts.PrinterOptions,
    printHandlers
  );

  // onAfterEmitNode
  printer;

  // const newFileStr = visitSourceFile(sourceFile);
  const transformerFactory = (context: TransformationContext) => {
    const transformer = (n: ts.Node): ts.Node => {
      // context.enableSubstitution(
      // context.requestEmitHelper(
      // emit helpers are for
      // context.
      // context.onEmitNode
      if (ts.isMemberName(n) && n.text === "registerSystem") {
        let newN = ts.factory.createIdentifier(n.text + "2");
        return newN;
      }
      // return n;
      return ts.visitEachChild(n, transformer, context);
    };
    return transformer;
  };
  const tRes = ts.transform(sourceFile, [transformerFactory]);
  // tRes.emitNodeWithNotification(ts.EmitHint.Unspecified, tRes.transformed[0], (
  let newFile = tRes.transformed[0] as ts.SourceFile;

  const newFileStr = printer.printNode(
    ts.EmitHint.Unspecified,
    newFile,
    newFile
  );

  console.log("writting..");

  // console.log(emit(newFile));
  fs.writeFile(PATH_OUT, newFileStr, (err) => {
    if (err) {
      console.error("WRITE ERROR:");
      console.error(err?.message);
    }
  });

  // function emit(n: ts.Node) {
  //   return printer.printNode(ts.EmitHint.Unspecified, n, sourceFile);
  // }

  // ts.transform

  // TODO(@darzu): does recursive traverse?
  // ts.forEachChild

  function visitSourceFile(e: ts.SourceFile): string {
    let children = e.getChildren();
    assert(children.length === 2);
    const [syntaxList, endOfFileToken] = children;
    assert(ts_isSyntaxList(syntaxList));
    assert(endOfFileToken.kind === ts.SyntaxKind.EndOfFileToken);

    let oldTxt = e.text;

    let res = "";

    syntaxList._children.forEach((oldStmt) => {
      if (ts.isStatement(oldStmt)) {
        let oldFullStart = oldStmt.pos;
        let oldStart = oldStmt.getStart(e);
        let prelude = oldTxt.substring(oldFullStart, oldStart);
        let newStmt = visitStmt(oldStmt);

        const isChanged = newStmt.pos < 0;
        // TODO(@darzu): printer needs to use info from the old one

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

// interface TsVisitor {
//   visit: (n: ts.Node) => ts.Node | undefined;
// }
// function createVisitor() {
//   // TODO(@darzu): IMPL
// }

// TODO(@darzu): Move these into TypeScript?
function ts_isDeclaration(e: ts.Node): e is ts.Declaration {
  return (
    e.kind === ts.SyntaxKind.ImportDeclaration
    // TODO(@darzu): add more kinds
  );
}
// ts.isstatementkin
// isStatement
// function ts_isStatement(e: ts.Node): e is ts.Statement {
//   // TODO(@darzu): annoying this doesn't exist already
//   return (
//     e.kind === ts.SyntaxKind.ImportDeclaration ||
//     e.kind === ts.SyntaxKind.IfStatement ||
//     e.kind === ts.SyntaxKind.ForStatement ||
//     e.kind === ts.SyntaxKind.FunctionDeclaration ||
//     e.kind === ts.SyntaxKind.ExpressionStatement
//     // TODO(@darzu): add more kinds
//   );
// }
function ts_isSyntaxList(e: ts.Node): e is ts.SyntaxList {
  return e.kind === ts.SyntaxKind.SyntaxList;
}

// TODO(@darzu): copied out of internal TypeScript
// public replaceRange(sourceFile: SourceFile, range: TextRange, newNode: Node, options: InsertNodeOptions = {}): void {
//   this.changes.push({ kind: ChangeKind.ReplaceWithSingleNode, sourceFile, range, options, node: newNode });
// }
// public replaceNode(sourceFile: SourceFile, oldNode: Node, newNode: Node, options: ChangeNodeOptions = useNonAdjustedPositions): void {
//   this.replaceRange(sourceFile, getAdjustedRange(sourceFile, oldNode, oldNode, options), newNode, options);
// }

// ts.changesToText

export interface TextChange {
  span: ts.TextSpan;
  newText: string;
}
export interface FileTextChanges {
  fileName: string;
  textChanges: readonly TextChange[];
  isNewFile?: boolean;
}

// span: start & len
// range: start & end

// changesToText.getTextChangesFromChanges:
//    group changes by file
//    sort changes by span
//      check none overlap
//

// function atLineStart() {
//   return ts.getLineStartPositionForPosition(pos, sourceFile) === pos
// }

function copyLeadingComments(
  sourceNode: ts.Node,
  targetNode: ts.Node,
  sourceFile: ts.SourceFile,
  commentKind?: ts.CommentKind,
  hasTrailingNewLine?: boolean
) {
  ts.forEachLeadingCommentRange(
    sourceFile.text,
    sourceNode.pos,
    getAddCommentsFunction(
      targetNode,
      sourceFile,
      commentKind,
      hasTrailingNewLine,
      ts.addSyntheticLeadingComment
    )
  );
}
function getAddCommentsFunction(
  targetNode: ts.Node,
  sourceFile: ts.SourceFile,
  commentKind: ts.CommentKind | undefined,
  hasTrailingNewLine: boolean | undefined,
  cb: (
    node: ts.Node,
    kind: ts.CommentKind,
    text: string,
    hasTrailingNewLine?: boolean
  ) => void
) {
  return (pos: number, end: number, kind: ts.CommentKind, htnl: boolean) => {
    if (kind === ts.SyntaxKind.MultiLineCommentTrivia) {
      // Remove leading /*
      pos += 2;
      // Remove trailing */
      end -= 2;
    } else {
      // Remove leading //
      pos += 2;
    }
    cb(
      targetNode,
      commentKind || kind,
      sourceFile.text.slice(pos, end),
      hasTrailingNewLine !== undefined ? hasTrailingNewLine : htnl
    );
  };
}

// TODO(@darzu): example emit:
/*
function emitIfStatement(node: IfStatement) {
        const openParenPos = emitTokenWithComment(SyntaxKind.IfKeyword, node.pos, writeKeyword, node);
        writeSpace();
        emitTokenWithComment(SyntaxKind.OpenParenToken, openParenPos, writePunctuation, node);
        emitExpression(node.expression);
        emitTokenWithComment(SyntaxKind.CloseParenToken, node.expression.end, writePunctuation, node);
        emitEmbeddedStatement(node, node.thenStatement);
        if (node.elseStatement) {
            writeLineOrSpace(node, node.thenStatement, node.elseStatement);
            emitTokenWithComment(SyntaxKind.ElseKeyword, node.thenStatement.end, writeKeyword, node);
            if (node.elseStatement.kind === SyntaxKind.IfStatement) {
                writeSpace();
                emit(node.elseStatement);
            }
            else {
                emitEmbeddedStatement(node, node.elseStatement);
            }
        }
    }
*/
