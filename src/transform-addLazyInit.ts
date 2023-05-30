import ts, { TransformationContext } from "typescript";
import { isEMMethodCall } from "./util-sprig.js";
import { assert } from "./util.js";

export function create_addLazyInit_transformers(): ts.TransformerFactory<ts.Node>[] {
  const pass1: ts.TransformerFactory<ts.Node> = function (
    context: TransformationContext
  ) {
    const transformer = (n: ts.Node): ts.Node => {
      if (isEMMethodCall(n, "registerInit")) {
        assert(ts.isPropertyAccessExpression(n.expression));
        assert(n.arguments.length === 1);
        const structArg = n.arguments[0];
        assert(ts.isObjectLiteralExpression(structArg));
        assert(structArg.properties.length == 3);

        let arg_requireRs: ts.Expression | undefined = undefined;
        let arg_provideRs: ts.Expression | undefined = undefined;
        let arg_fn: ts.Expression | undefined = undefined;
        for (let p of structArg.properties) {
          assert(ts.isPropertyAssignment(p));
          assert(ts.isIdentifier(p.name!));
          if (p.name.text === "requireRs") arg_requireRs = p.initializer;
          else if (p.name.text === "provideRs") arg_provideRs = p.initializer;
          else if (p.name.text === "fn") arg_fn = p.initializer;
          else assert(false);
        }
        assert(arg_requireRs && arg_provideRs && arg_fn);

        const newArgs = [arg_requireRs, arg_provideRs, arg_fn];
        const newPropAccess = ts.factory.createPropertyAccessExpression(
          n.expression.expression,
          "addLazyInit"
        );
        const newExp = ts.factory.updateCallExpression(
          n,
          newPropAccess,
          n.typeArguments,
          newArgs
        );
        return newExp;
      }

      return ts.visitEachChild(n, transformer, context);
    };
    return transformer;
  };

  return [pass1];
}
