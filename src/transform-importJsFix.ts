import ts, { TransformationContext } from "typescript";
import { isEMMethodCall } from "./util-sprig.js";
import { assert } from "./util.js";

export function create_importJsFix_transformers(): ts.TransformerFactory<ts.Node>[] {
  const pass1: ts.TransformerFactory<ts.Node> = function (
    context: TransformationContext
  ) {
    const transformer = (n: ts.Node): ts.Node => {
      // check for import
      if (ts.isImportDeclaration(n)) {
        if (ts.isStringLiteral(n.moduleSpecifier)) {
          const path = n.moduleSpecifier.text;
          if (!path.endsWith(".js")) {
            return ts.factory.updateImportDeclaration(
              n,
              n.modifiers,
              n.importClause,
              ts.factory.createStringLiteral(n.moduleSpecifier.text + ".js"),
              n.assertClause
            );
          }
        }
      }

      return ts.visitEachChild(n, transformer, context);
    };
    return transformer;
  };

  return [pass1];
}
