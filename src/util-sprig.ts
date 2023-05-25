import ts from "typescript";
import { assert } from "./util.js";

export function isEMMethodCall(
  n: ts.Node,
  methodName: string
): n is ts.CallExpression {
  if (ts.isCallExpression(n)) {
    const propExp = n.expression;
    if (ts.isPropertyAccessExpression(propExp)) {
      const member = propExp.name;
      const emExp = propExp.expression;
      if (ts.isIdentifier(emExp)) {
        if (
          (emExp.text === "EM" || emExp.text === "em") &&
          member.text === methodName
        ) {
          return true;
        }
      }
    }
  }
  return false;
}
