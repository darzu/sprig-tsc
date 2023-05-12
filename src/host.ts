import { assert, never } from "./util.js";
import fs from "fs";
import ts from "typescript";

// TODO(@darzu): I hate using sync filesystem io here
// import { promises as fs } from "fs";

type CompilerHost = ReturnType<typeof ts.createCompilerHost>; // WTF. Why isn't CompilerHost exported?

// TODO(@darzu): combined host?
// type TsHost = CompilerHost | ts.LanguageServiceHost;

export function addPaths(a: string, b: string) {
  const isA = a.endsWith("/");
  const isB = b.startsWith("/");
  if (isA && !isB) return a + b;
  else if (!isA && isB) return a + b;
  else if (!isA && !isB) return a + "/" + b;
  else if (isA && isB) return a + b.slice(1);
  else throw `impossible`;
}
// export function _test_combinePath() {
//   console.log(addPaths("a", "b"));
//   console.log(addPaths("a/", "b"));
//   console.log(addPaths("a", "/b"));
//   console.log(addPaths("a/", "/b"));
// }

export function createCompilerHost(rootDir: string): CompilerHost {
  if (!rootDir.endsWith("/")) rootDir += "/";

  function relativizePath(path: string) {
    assert(!path.startsWith("/"), `Can't handle absolute path: ${path}`);
    assert(!path.startsWith("../"), `TODO: "../" paths: ${path}`);
    if (path.startsWith("./")) return path.slice(2);
    return path;
  }
  function realPath(path: string) {
    assert(
      !path.startsWith("./"),
      `Need to relativizePath before calling realPath`
    );
    return rootDir + path;
  }

  function getSourceFile(
    fileName: string,
    languageVersionOrOptions: ts.ScriptTarget | ts.CreateSourceFileOptions,
    onError?: ((message: string) => void) | undefined,
    shouldCreateNewSourceFile?: boolean | undefined
  ): ts.SourceFile | undefined {
    console.log(`SRC: ${fileName}`);
    assert(!shouldCreateNewSourceFile, `TODO: shouldCreateNewSourceFile`);
    if (!fileExists(fileName)) return undefined;
    const txt = "console.log('hello world!');"; // TODO(@darzu): IMPL!
    return ts.createSourceFile(fileName, txt, languageVersionOrOptions);
  }
  function getDefaultLibFileName(options: ts.CompilerOptions): string {
    console.log(`LIB: ${options.target}`);
    // TODO(@darzu): does this need to be w/ a path?
    const res = ts.getDefaultLibFileName(options);
    console.log(`LIB NAME: ${res}`);
    return res;
    // throw "TODO 2";
  }
  function getDefaultLibLocation() {
    console.log(`LIB LOC!`);
    return `external/ts-libs`;
  }
  function writeFile(
    fileName: string,
    text: string,
    writeByteOrderMark: boolean,
    onError?: ((message: string) => void) | undefined,
    sourceFiles?: readonly ts.SourceFile[] | undefined,
    data?: ts.WriteFileCallbackData | undefined
  ): void {
    console.log(`WRITE ${fileName}`);
    throw "TODO 3";
  }
  function getCurrentDirectory(): string {
    console.log(`CUR DIR`);
    // return "/FOODIR/";
    return "./";
  }
  function getCanonicalFileName(fileName: string): string {
    console.log(`CANNON: ${fileName}`);
    let res = relativizePath(fileName);
    console.log(`RES: ${res}`);
    return res;
  }
  function useCaseSensitiveFileNames(): boolean {
    return true;
  }
  function getNewLine(): string {
    return "\n";
  }
  function fileExists(path: string): boolean {
    console.log(`EXISTS F? ${path}`);
    path = realPath(relativizePath(path));
    const res = fsExistsHelper(path, true, false);
    console.log(`RES: ${path} ${res}`);
    return res;
  }
  function directoryExists(path: string): boolean {
    console.log(`EXISTS D? ${path}`);
    path = realPath(relativizePath(path));
    const res = fsExistsHelper(path, false, true);
    console.log(`RES: ${res}`);
    return res;
  }
  function readFile(fileName: string): string | undefined {
    throw "TODO 9";
  }

  const res: ts.CompilerHost = {
    getSourceFile,
    getDefaultLibFileName,
    getDefaultLibLocation,
    writeFile,
    getCurrentDirectory,
    getCanonicalFileName,
    useCaseSensitiveFileNames,
    getNewLine,
    fileExists,
    directoryExists,
    readFile,
  };
  return res;
}

function fsExistsHelper(
  path: string,
  allowFile: boolean,
  allowDir: boolean
): boolean {
  try {
    const stat = fs.statSync(path);
    if (!stat) return false;
    if (allowFile && stat.isFile()) return true;
    if (allowDir && stat.isDirectory()) return true;
  } catch (_) {}
  return false;
}

// function createLanguageServiceHost(p: ts.Program): ts.LanguageServiceHost {
//   // getSourceFile, writeFile, getCanonicalFileName, useCaseSensitiveFileNames, getNewLine
//   return {
//     readFile: (path: string, encoding?: string): string | undefined => {
//       // TODO(@darzu): IMPL
//       return "";
//     },
//     fileExists: (path: string, encoding?: string): boolean => {
//       // TODO(@darzu): IMPL
//       return false;
//     },
//     getCompilationSettings: (): ts.CompilerOptions => {
//       const opts = p.getCompilerOptions();
//       opts.noLib = true;
//       return opts;
//     },
//     // getNewLine: (): string => {
//     //   return "\n";
//     // },

//     getScriptFileNames: (): string[] => {
//       return p.getSourceFiles().map((f) => f.fileName);
//     },

//     getScriptVersion: (fileName: string): string => {
//       return "0";
//     },

//     getScriptSnapshot: (fileName: string): ts.IScriptSnapshot => {
//       const f = p.getSourceFile(fileName)!;
//       return {
//         getLength: () => f.getFullText().length,
//         getText: () => f.getFullText(),
//         getChangeRange: () => undefined,
//       };
//     },

//     getCurrentDirectory: (): string => {
//       return ".";
//     },

//     getDefaultLibFileName: (options: ts.CompilerOptions): string => {
//       // TODO(@darzu): does this need to be w/ a path?
//       return ts.getDefaultLibFileName(options);
//     },

//     // useCaseSensitiveFileNames: (): boolean => {
//     //   return true;
//     // },
//   };
// }
