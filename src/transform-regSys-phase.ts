import ts, { TransformationContext } from "typescript";
import { isEMMethodCall } from "./util-sprig.js";
import { assert } from "./util.js";

export function create_regSystemPhase_transformers(): ts.TransformerFactory<ts.Node>[] {
  /*
  pass 1: collect names->phases
  pass 2: insert phase parameter
  */
  const systemToPhase = new Map<string, ts.PropertyAccessExpression>();
  const fileToHasImport = new Set<string>();

  const pass1: ts.TransformerFactory<ts.Node> = function (
    context: TransformationContext
  ) {
    const transformer = (n: ts.Node): ts.Node => {
      // collect system phases
      if (isEMMethodCall(n, "addSystem")) {
        assert(ts.isPropertyAccessExpression(n.expression));
        const sysName = n.arguments[0];
        assert(ts.isStringLiteral(sysName));
        const phase = n.arguments[1];
        assert(ts.isPropertyAccessExpression(phase));
        assert(ts.isIdentifier(phase.expression));
        assert(phase.expression.text === "Phase");

        // console.log(`found: ${sysName.text} -> ${phase.name.text}`);
        systemToPhase.set(sysName.text, phase);
      }

      // check for import
      if (ts.isImportDeclaration(n)) {
        if (ts.isStringLiteral(n.moduleSpecifier)) {
          const path = n.moduleSpecifier.text;
          if (path.endsWith("/sys_phase.js")) {
            fileToHasImport.add(n.getSourceFile().fileName);
            // TODO(@darzu): USE?
          }
        }
      }

      return ts.visitEachChild(n, transformer, context);
    };
    return transformer;
  };

  const pass2: ts.TransformerFactory<ts.Node> = function (
    context: TransformationContext
  ) {
    const transformer = (n: ts.Node): ts.Node => {
      if (isEMMethodCall(n, "registerSystem")) {
        assert(ts.isPropertyAccessExpression(n.expression));

        const name = n.arguments[0]; // name
        if (ts.isStringLiteral(name)) {
          const newProp = ts.factory.createPropertyAccessExpression(
            n.expression.expression,
            "registerSystem2"
          );

          const oldPhaseExp = systemToPhase.get(name.text);
          if (!oldPhaseExp) {
            throw new Error(`can't find phase for: ${name.text}`);
          }

          const phaseExp = ts.factory.createPropertyAccessExpression(
            ts.factory.createIdentifier("Phase"),
            oldPhaseExp.name.text
          );

          const newArgs = [
            name, // name
            phaseExp, // new phase
            n.arguments[1], // components query
            n.arguments[2], // resources query
            n.arguments[3], // callback
          ];
          // const fnType = e.typeArguments![0];
          // const nameType = e.typeArguments![1];
          const newCall = ts.factory.createCallExpression(newProp, [], newArgs);
          // const newStmt = ts.factory.createExpressionStatement(newCall);
          return newCall; // TODO(@darzu): does this break the transformer recursion?
        }
      }
      return ts.visitEachChild(n, transformer, context);
    };
    return transformer;
  };

  return [pass1, pass2];
}
