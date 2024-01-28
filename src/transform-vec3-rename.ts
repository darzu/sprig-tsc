import ts, {
  TransformationContext,
  isIdentifier,
  isImportDeclaration,
  isInterfaceDeclaration,
  isModuleDeclaration,
} from "typescript";
import { isEMMethodCall } from "./util-sprig.js";
import { assert } from "./util.js";

export const regVec3Rename: ts.TransformerFactory<ts.Node> = function (
  context: TransformationContext
) {
  const transformer = (n: ts.Node): ts.Node => {
    // if (isImportDeclaration(n)) return n;
    // if (isModuleDeclaration(n)) return n;
    if (isInterfaceDeclaration(n)) return n;
    if (isIdentifier(n) && n.text === "vec3") {
      return ts.factory.createIdentifier("V3");
    }
    return ts.visitEachChild(n, transformer, context);
  };
  return transformer;
};
