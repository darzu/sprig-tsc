import ts, { TransformationContext } from "typescript";

export const registerSystemTransformer: ts.TransformerFactory<ts.Node> =
  function (context: TransformationContext) {
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
