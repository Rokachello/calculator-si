type Token =
  | { type: "number"; value: number }
  | { type: "identifier"; value: string }
  | { type: "operator"; value: string }
  | { type: "paren"; value: "(" | ")" }
  | { type: "comma" };

type RpnToken =
  | { type: "number"; value: number }
  | { type: "variable"; value: string }
  | { type: "operator"; value: string }
  | { type: "function"; value: string };

const FUNCTIONS: Record<string, { argc: number; fn: (...args: number[]) => number }> = {
  abs: { argc: 1, fn: Math.abs },
  sqrt: { argc: 1, fn: Math.sqrt },
  round: { argc: 1, fn: Math.round },
  floor: { argc: 1, fn: Math.floor },
  ceil: { argc: 1, fn: Math.ceil },
  min: { argc: 2, fn: Math.min },
  max: { argc: 2, fn: Math.max },
  pow: { argc: 2, fn: Math.pow },
};

const PRECEDENCE: Record<string, number> = { "u-": 5, "^": 4, "*": 3, "/": 3, "+": 2, "-": 2 };
const RIGHT_ASSOCIATIVE = new Set(["^", "u-"]);

function tokenize(expression: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < expression.length) {
    const ch = expression[i];
    if (/\s/.test(ch)) { i += 1; continue; }
    if (/[0-9.]/.test(ch)) {
      let raw = ""; let dots = 0;
      while (i < expression.length && /[0-9.]/.test(expression[i])) {
        if (expression[i] === ".") dots += 1;
        raw += expression[i++];
      }
      if (dots > 1 || raw === ".") throw new Error("Invalid number in formula");
      const value = Number(raw);
      if (!Number.isFinite(value)) throw new Error("Invalid numeric literal");
      tokens.push({ type: "number", value }); continue;
    }
    if (/[A-Za-z_]/.test(ch)) {
      let name = "";
      while (i < expression.length && /[A-Za-z0-9_]/.test(expression[i])) name += expression[i++];
      tokens.push({ type: "identifier", value: name }); continue;
    }
    if ("+-*/^".includes(ch)) { tokens.push({ type: "operator", value: ch }); i++; continue; }
    if (ch === "(" || ch === ")") { tokens.push({ type: "paren", value: ch }); i++; continue; }
    if (ch === ",") { tokens.push({ type: "comma" }); i++; continue; }
    throw new Error(`Unsupported character in formula: ${ch}`);
  }
  return tokens;
}

function toRpn(tokens: Token[], allowedVariables: Set<string>): RpnToken[] {
  const output: RpnToken[] = [];
  const stack: Array<Token | { type: "function-marker"; value: string }> = [];
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];
    const previous = index > 0 ? tokens[index - 1] : null;
    const next = index + 1 < tokens.length ? tokens[index + 1] : null;
    if (token.type === "number") { output.push(token); continue; }
    if (token.type === "identifier") {
      if (next?.type === "paren" && next.value === "(") {
        if (!FUNCTIONS[token.value]) throw new Error(`Unsupported function: ${token.value}`);
        stack.push({ type: "function-marker", value: token.value });
      } else {
        if (!allowedVariables.has(token.value)) throw new Error(`Unknown variable: ${token.value}`);
        output.push({ type: "variable", value: token.value });
      }
      continue;
    }
    if (token.type === "comma") {
      while (stack.length) {
        const top = stack[stack.length - 1];
        if (top.type === "paren" && top.value === "(") break;
        const popped = stack.pop()!;
        if (popped.type === "operator") output.push({ type: "operator", value: popped.value });
        if (popped.type === "function-marker") output.push({ type: "function", value: popped.value });
      }
      if (!stack.length) throw new Error("Misplaced comma in formula");
      continue;
    }
    if (token.type === "operator") {
      const isUnaryMinus = token.value === "-" && (
        previous === null || previous.type === "operator" || previous.type === "comma" ||
        (previous.type === "paren" && previous.value === "(")
      );
      const op = isUnaryMinus ? "u-" : token.value;
      while (stack.length) {
        const top = stack[stack.length - 1];
        if (top.type !== "operator") break;
        const shouldPop = RIGHT_ASSOCIATIVE.has(op)
          ? PRECEDENCE[op] < PRECEDENCE[top.value]
          : PRECEDENCE[op] <= PRECEDENCE[top.value];
        if (!shouldPop) break;
        stack.pop(); output.push({ type: "operator", value: top.value });
      }
      stack.push({ type: "operator", value: op }); continue;
    }
    if (token.type === "paren" && token.value === "(") { stack.push(token); continue; }
    if (token.type === "paren" && token.value === ")") {
      let foundOpen = false;
      while (stack.length) {
        const popped = stack.pop()!;
        if (popped.type === "paren" && popped.value === "(") { foundOpen = true; break; }
        if (popped.type === "operator") output.push({ type: "operator", value: popped.value });
        if (popped.type === "function-marker") output.push({ type: "function", value: popped.value });
      }
      if (!foundOpen) throw new Error("Mismatched parentheses");
      const maybeFunction = stack[stack.length - 1];
      if (maybeFunction?.type === "function-marker") {
        stack.pop(); output.push({ type: "function", value: maybeFunction.value });
      }
    }
  }
  while (stack.length) {
    const popped = stack.pop()!;
    if (popped.type === "paren") throw new Error("Mismatched parentheses");
    if (popped.type === "operator") output.push({ type: "operator", value: popped.value });
    if (popped.type === "function-marker") output.push({ type: "function", value: popped.value });
  }
  return output;
}

export function evaluateFormula(expression: string, variables: Record<string, number>): number {
  const rpn = toRpn(tokenize(expression), new Set(Object.keys(variables)));
  const stack: number[] = [];
  for (const token of rpn) {
    if (token.type === "number") { stack.push(token.value); continue; }
    if (token.type === "variable") {
      const value = variables[token.value];
      if (!Number.isFinite(value)) throw new Error(`Invalid value for ${token.value}`);
      stack.push(value); continue;
    }
    if (token.type === "operator") {
      if (token.value === "u-") {
        if (stack.length < 1) throw new Error("Invalid unary minus");
        stack.push(-stack.pop()!); continue;
      }
      if (stack.length < 2) throw new Error("Invalid formula");
      const b = stack.pop()!, a = stack.pop()!;
      let value: number;
      switch (token.value) {
        case "+": value = a + b; break;
        case "-": value = a - b; break;
        case "*": value = a * b; break;
        case "/": if (b === 0) throw new Error("Division by zero"); value = a / b; break;
        case "^": value = a ** b; break;
        default: throw new Error(`Unsupported operator: ${token.value}`);
      }
      if (!Number.isFinite(value)) throw new Error("Formula produced a non-finite result");
      stack.push(value); continue;
    }
    const fnDef = FUNCTIONS[token.value];
    if (!fnDef || stack.length < fnDef.argc) throw new Error(`Invalid function call: ${token.value}`);
    const args = stack.splice(stack.length - fnDef.argc, fnDef.argc);
    const value = fnDef.fn(...args);
    if (!Number.isFinite(value)) throw new Error(`Function ${token.value} produced a non-finite result`);
    stack.push(value);
  }
  if (stack.length !== 1) throw new Error("Invalid formula structure");
  return stack[0];
}

export function validateFormula(expression: string, variableNames: string[], sampleValues: Record<string, number>): void {
  if (expression.length > 500) throw new Error("Formula is too long");
  const result = evaluateFormula(expression, sampleValues);
  if (!Number.isFinite(result)) throw new Error("Formula is not valid");
  for (const name of variableNames) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) throw new Error(`Invalid input id: ${name}`);
  }
}
