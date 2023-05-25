import ts, { TransformationContext } from "typescript";
import { isEMMethodCall } from "./util-sprig.js";
import { assert } from "./util.js";

export const registerSystemTransformer: ts.TransformerFactory<ts.Node> =
  function (context: TransformationContext) {
    const transformer = (n: ts.Node): ts.Node => {
      if (isEMMethodCall(n, "registerSystem")) {
        assert(ts.isPropertyAccessExpression(n.expression));
        const newProp = ts.factory.createPropertyAccessExpression(
          n.expression.expression,
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
      return ts.visitEachChild(n, transformer, context);
    };
    return transformer;
  };
