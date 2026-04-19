const COMPARISON_OPERATORS = new Set(["<", "<=", ">", ">=", "===", "!=="]);
const ARRAY_METHOD_WHITELIST = new Set([
  "push",
  "pop",
  "shift",
  "unshift",
  "slice",
  "splice",
  "concat",
  "includes",
  "indexOf",
  "join",
]);
const MATH_METHOD_WHITELIST = new Set([
  "floor",
  "ceil",
  "round",
  "max",
  "min",
  "abs",
  "pow",
  "sqrt",
]);

function deepClone(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function createMeta() {
  return {
    comparisons: 0,
    arrayAccesses: 0,
    highlightedIndices: new Set(),
  };
}

function mergeMeta(a, b) {
  a.comparisons += b.comparisons;
  a.arrayAccesses += b.arrayAccesses;
  for (const index of b.highlightedIndices) {
    a.highlightedIndices.add(index);
  }
  return a;
}

function normalizeMeta(meta) {
  return {
    comparisons: meta.comparisons,
    arrayAccesses: meta.arrayAccesses,
    highlightedIndices: [...meta.highlightedIndices],
  };
}

function isIdentifier(node) {
  return node?.type === "Identifier";
}

function isUserFunctionCall(node, functionNames) {
  return (
    node?.type === "CallExpression" &&
    node.callee?.type === "Identifier" &&
    functionNames.has(node.callee.name)
  );
}

function containsUserFunctionCall(node, functionNames) {
  if (!node || typeof node !== "object") {
    return false;
  }
  if (isUserFunctionCall(node, functionNames)) {
    return true;
  }
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (containsUserFunctionCall(item, functionNames)) {
          return true;
        }
      }
      continue;
    }
    if (containsUserFunctionCall(value, functionNames)) {
      return true;
    }
  }
  return false;
}

function createCompilerState(functionNames) {
  return {
    functionNames,
    instructionId: 1,
    tempId: 0,
  };
}

function makeTemp(state) {
  const temp = `__tmp${state.tempId}`;
  state.tempId += 1;
  return temp;
}

function emitInstruction(instructions, compilerState, node, payload) {
  const instruction = {
    id: compilerState.instructionId,
    line: node.loc?.start?.line ?? 0,
    nodeType: node.type,
    ...payload,
  };
  compilerState.instructionId += 1;
  instructions.push(instruction);
  return instructions.length - 1;
}

function compileStatement(node, instructions, compilerState, loopContext = null) {
  switch (node.type) {
    case "VariableDeclaration": {
      for (const declarator of node.declarations) {
        if (!isIdentifier(declarator.id)) {
          throw new Error("Only identifier declarations are supported.");
        }
        const variableName = declarator.id.name;
        const init = declarator.init ?? null;

        if (isUserFunctionCall(init, compilerState.functionNames)) {
          emitInstruction(instructions, compilerState, declarator, {
            op: "CALL",
            callee: init.callee.name,
            args: init.arguments ?? [],
            assignTo: { kind: "identifier", name: variableName },
          });
          continue;
        }

        if (containsUserFunctionCall(init, compilerState.functionNames)) {
          throw new Error(
            `Nested user function calls are not supported in declaration for "${variableName}" at line ${declarator.loc?.start?.line ?? 0}.`,
          );
        }

        emitInstruction(instructions, compilerState, declarator, {
          op: "DECLARE",
          name: variableName,
          init,
        });
      }
      break;
    }
    case "ExpressionStatement": {
      const expression = node.expression;

      if (expression.type === "AssignmentExpression") {
        if (expression.operator !== "=" && !expression.operator.endsWith("=")) {
          throw new Error(
            `Unsupported assignment operator "${expression.operator}" at line ${node.loc?.start?.line ?? 0}.`,
          );
        }

        if (isUserFunctionCall(expression.right, compilerState.functionNames)) {
          emitInstruction(instructions, compilerState, node, {
            op: "CALL",
            callee: expression.right.callee.name,
            args: expression.right.arguments ?? [],
            assignTo: {
              kind: "target",
              target: expression.left,
              operator: expression.operator,
            },
          });
          break;
        }

        if (containsUserFunctionCall(expression.right, compilerState.functionNames)) {
          throw new Error(
            `Nested user function call in assignment at line ${node.loc?.start?.line ?? 0} is unsupported.`,
          );
        }

        emitInstruction(instructions, compilerState, node, {
          op: "ASSIGN",
          operator: expression.operator,
          target: expression.left,
          value: expression.right,
        });
        break;
      }

      if (isUserFunctionCall(expression, compilerState.functionNames)) {
        emitInstruction(instructions, compilerState, node, {
          op: "CALL",
          callee: expression.callee.name,
          args: expression.arguments ?? [],
          assignTo: { kind: "ignore" },
        });
        break;
      }

      if (containsUserFunctionCall(expression, compilerState.functionNames)) {
        throw new Error(
          `Nested user function call in expression at line ${node.loc?.start?.line ?? 0} is unsupported.`,
        );
      }

      emitInstruction(instructions, compilerState, node, {
        op: "EXPR",
        expr: expression,
      });
      break;
    }
    case "IfStatement": {
      if (containsUserFunctionCall(node.test, compilerState.functionNames)) {
        throw new Error(
          `User function calls in if conditions are unsupported (line ${node.loc?.start?.line ?? 0}).`,
        );
      }
      const falseJumpIndex = emitInstruction(instructions, compilerState, node.test, {
        op: "JUMP_IF_FALSE",
        test: node.test,
        target: null,
      });
      compileStatement(node.consequent, instructions, compilerState, loopContext);

      if (node.alternate) {
        const endJumpIndex = emitInstruction(instructions, compilerState, node, {
          op: "JUMP",
          target: null,
        });
        instructions[falseJumpIndex].target = instructions.length;
        compileStatement(node.alternate, instructions, compilerState, loopContext);
        instructions[endJumpIndex].target = instructions.length;
      } else {
        instructions[falseJumpIndex].target = instructions.length;
      }
      break;
    }
    case "BlockStatement": {
      for (const child of node.body) {
        compileStatement(child, instructions, compilerState, loopContext);
      }
      break;
    }
    case "WhileStatement": {
      if (containsUserFunctionCall(node.test, compilerState.functionNames)) {
        throw new Error(
          `User function calls in while conditions are unsupported (line ${node.loc?.start?.line ?? 0}).`,
        );
      }
      const loopStart = instructions.length;
      const exitJump = emitInstruction(instructions, compilerState, node.test, {
        op: "JUMP_IF_FALSE",
        test: node.test,
        target: null,
      });
      const localLoopContext = { breaks: [], continues: [], continueTarget: loopStart };
      compileStatement(node.body, instructions, compilerState, localLoopContext);
      const continueTarget = loopStart;
      for (const continueIndex of localLoopContext.continues) {
        instructions[continueIndex].target = continueTarget;
      }
      emitInstruction(instructions, compilerState, node, { op: "JUMP", target: loopStart });
      const end = instructions.length;
      instructions[exitJump].target = end;
      for (const breakIndex of localLoopContext.breaks) {
        instructions[breakIndex].target = end;
      }
      break;
    }
    case "ForStatement": {
      if (node.init) {
        if (node.init.type === "VariableDeclaration") {
          compileStatement(node.init, instructions, compilerState, loopContext);
        } else {
          emitInstruction(instructions, compilerState, node.init, {
            op: "EXPR",
            expr: node.init,
          });
        }
      }

      const loopStart = instructions.length;
      let exitJump = null;

      if (node.test) {
        if (containsUserFunctionCall(node.test, compilerState.functionNames)) {
          throw new Error(
            `User function calls in for conditions are unsupported (line ${node.loc?.start?.line ?? 0}).`,
          );
        }
        exitJump = emitInstruction(instructions, compilerState, node.test, {
          op: "JUMP_IF_FALSE",
          test: node.test,
          target: null,
        });
      }

      const localLoopContext = { breaks: [], continues: [], continueTarget: null };
      compileStatement(node.body, instructions, compilerState, localLoopContext);
      const updateStart = instructions.length;
      localLoopContext.continueTarget = updateStart;
      for (const continueIndex of localLoopContext.continues) {
        instructions[continueIndex].target = updateStart;
      }

      if (node.update) {
        emitInstruction(instructions, compilerState, node.update, {
          op: "EXPR",
          expr: node.update,
        });
      }
      emitInstruction(instructions, compilerState, node, { op: "JUMP", target: loopStart });
      const end = instructions.length;
      if (exitJump !== null) {
        instructions[exitJump].target = end;
      }
      for (const breakIndex of localLoopContext.breaks) {
        instructions[breakIndex].target = end;
      }
      break;
    }
    case "BreakStatement": {
      if (!loopContext) {
        throw new Error(`"break" used outside a loop at line ${node.loc?.start?.line ?? 0}.`);
      }
      const index = emitInstruction(instructions, compilerState, node, {
        op: "JUMP",
        target: null,
      });
      loopContext.breaks.push(index);
      break;
    }
    case "ContinueStatement": {
      if (!loopContext) {
        throw new Error(`"continue" used outside a loop at line ${node.loc?.start?.line ?? 0}.`);
      }
      const index = emitInstruction(instructions, compilerState, node, {
        op: "JUMP",
        target: null,
      });
      loopContext.continues.push(index);
      break;
    }
    case "ReturnStatement": {
      const argument = node.argument ?? null;
      if (isUserFunctionCall(argument, compilerState.functionNames)) {
        const temp = makeTemp(compilerState);
        emitInstruction(instructions, compilerState, node, {
          op: "CALL",
          callee: argument.callee.name,
          args: argument.arguments ?? [],
          assignTo: { kind: "identifier", name: temp },
        });
        emitInstruction(instructions, compilerState, node, {
          op: "RETURN",
          expr: { type: "Identifier", name: temp },
        });
      } else {
        if (containsUserFunctionCall(argument, compilerState.functionNames)) {
          throw new Error(
            `Nested user function call in return statement at line ${node.loc?.start?.line ?? 0} is unsupported.`,
          );
        }
        emitInstruction(instructions, compilerState, node, {
          op: "RETURN",
          expr: argument,
        });
      }
      break;
    }
    case "FunctionDeclaration":
      break;
    default:
      throw new Error(`Unsupported statement type "${node.type}" at line ${node.loc?.start?.line ?? 0}.`);
  }
}

function compileFunction(node, compilerState) {
  const instructions = [];
  for (const statement of node.body.body) {
    compileStatement(statement, instructions, compilerState);
  }
  return {
    name: node.id.name,
    params: node.params.map((param) => {
      if (!isIdentifier(param)) {
        throw new Error(`Only identifier params are supported in ${node.id.name}.`);
      }
      return param.name;
    }),
    line: node.loc?.start?.line ?? 0,
    instructions,
  };
}

function collectFunctionDeclarations(ast) {
  const functionNames = new Set();
  for (const statement of ast.body) {
    if (statement.type === "FunctionDeclaration" && statement.id?.name) {
      functionNames.add(statement.id.name);
    }
  }
  return functionNames;
}

export function compileProgram(ast) {
  const functionNames = collectFunctionDeclarations(ast);
  const compilerState = createCompilerState(functionNames);
  const functions = {};

  for (const statement of ast.body) {
    if (statement.type === "FunctionDeclaration") {
      functions[statement.id.name] = compileFunction(statement, compilerState);
    }
  }

  const mainInstructions = [];
  for (const statement of ast.body) {
    if (statement.type === "FunctionDeclaration") {
      continue;
    }
    compileStatement(statement, mainInstructions, compilerState);
  }

  return {
    functions,
    mainInstructions,
    functionNames: [...functionNames],
    instructionCount: compilerState.instructionId - 1,
  };
}

function createFrame(frameId, name, instructions, env = {}) {
  return {
    id: frameId,
    name,
    instructions,
    pc: 0,
    env,
    pendingReturn: null,
  };
}

export function createRuntime(compiledProgram) {
  const globalEnv = {};
  const programFrame = createFrame(0, "program", compiledProgram.mainInstructions, globalEnv);

  return {
    functions: compiledProgram.functions,
    frames: [programFrame],
    globalEnv,
    metrics: {
      comparisons: 0,
      swaps: 0,
      arrayAccesses: 0,
    },
    nextFrameId: 1,
    nextStepId: 1,
    terminated: false,
    result: undefined,
    error: null,
    lastVizPatch: { highlightedIndices: [] },
    lastOperation: "",
    lastLine: getCurrentLine({
      frames: [programFrame],
      terminated: false,
    }),
  };
}

function getTopFrame(runtime) {
  if (runtime.frames.length === 0) {
    return null;
  }
  return runtime.frames[runtime.frames.length - 1];
}

function getFrameLine(frame) {
  if (!frame || frame.pc < 0 || frame.pc >= frame.instructions.length) {
    return null;
  }
  return frame.instructions[frame.pc].line;
}

function formatFrame(frame) {
  return {
    funcName: frame.name,
    line: getFrameLine(frame),
    variables: deepClone(frame.env),
  };
}

function snapshotPublicState(runtime) {
  const topFrame = getTopFrame(runtime);
  const mergedVariables = deepClone(runtime.globalEnv);
  if (topFrame) {
    Object.assign(mergedVariables, deepClone(topFrame.env));
  }
  return {
    variables: mergedVariables,
    callStack: runtime.frames.map(formatFrame),
    metrics: deepClone(runtime.metrics),
  };
}

function computeVarDiff(before, after) {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const diff = {};
  for (const key of keys) {
    const left = before[key];
    const right = after[key];
    if (JSON.stringify(left) !== JSON.stringify(right)) {
      diff[key] = { before: deepClone(left), after: deepClone(right) };
    }
  }
  return diff;
}

function computeCallStackDiff(before, after) {
  const beforeNames = before.map((frame) => frame.funcName);
  const afterNames = after.map((frame) => frame.funcName);
  return {
    before: beforeNames,
    after: afterNames,
  };
}

function resolveIdentifier(frame, runtime, identifierName) {
  if (Object.prototype.hasOwnProperty.call(frame.env, identifierName)) {
    return frame.env[identifierName];
  }
  if (Object.prototype.hasOwnProperty.call(runtime.globalEnv, identifierName)) {
    return runtime.globalEnv[identifierName];
  }
  if (identifierName === "undefined") {
    return undefined;
  }
  if (identifierName === "Math") {
    return Math;
  }
  if (identifierName === "Infinity") {
    return Infinity;
  }
  if (identifierName === "NaN") {
    return Number.NaN;
  }
  return undefined;
}

function setIdentifier(frame, runtime, name, value) {
  if (Object.prototype.hasOwnProperty.call(frame.env, name)) {
    frame.env[name] = value;
    return value;
  }
  if (Object.prototype.hasOwnProperty.call(runtime.globalEnv, name)) {
    runtime.globalEnv[name] = value;
    return value;
  }
  frame.env[name] = value;
  return value;
}

function evaluateMemberTarget(node, frame, runtime) {
  const objectResult = evaluateExpression(node.object, frame, runtime);
  const propertyResult = node.computed
    ? evaluateExpression(node.property, frame, runtime)
    : { value: node.property.name, meta: createMeta() };

  const meta = mergeMeta(objectResult.meta, propertyResult.meta);
  const objectValue = objectResult.value;
  const propertyValue = propertyResult.value;

  if (Array.isArray(objectValue) && Number.isInteger(Number(propertyValue))) {
    meta.arrayAccesses += 1;
    meta.highlightedIndices.add(Number(propertyValue));
  }

  return {
    object: objectValue,
    property: propertyValue,
    objectName: node.object?.type === "Identifier" ? node.object.name : null,
    meta,
  };
}

function evaluateCallExpression(expr, frame, runtime) {
  const meta = createMeta();
  const args = [];

  for (const arg of expr.arguments ?? []) {
    const evaluatedArg = evaluateExpression(arg, frame, runtime);
    mergeMeta(meta, evaluatedArg.meta);
    args.push(evaluatedArg.value);
  }

  if (expr.callee.type === "Identifier") {
    const calleeName = expr.callee.name;
    if (runtime.functions[calleeName]) {
      throw new Error(`Nested call to user function "${calleeName}" is unsupported in expressions.`);
    }
    if (calleeName === "Number") {
      return { value: Number(args[0]), meta };
    }
    if (calleeName === "String") {
      return { value: String(args[0]), meta };
    }
    if (calleeName === "Boolean") {
      return { value: Boolean(args[0]), meta };
    }
    if (calleeName === "parseInt") {
      return { value: Number.parseInt(args[0], args[1]), meta };
    }
    if (calleeName === "parseFloat") {
      return { value: Number.parseFloat(args[0]), meta };
    }
    throw new Error(`Unsupported call "${calleeName}" in expression.`);
  }

  if (expr.callee.type === "MemberExpression") {
    const target = evaluateMemberTarget(expr.callee, frame, runtime);
    mergeMeta(meta, target.meta);

    if (target.object === Math && MATH_METHOD_WHITELIST.has(target.property)) {
      return { value: Math[target.property](...args), meta };
    }

    if (Array.isArray(target.object) && ARRAY_METHOD_WHITELIST.has(target.property)) {
      const method = target.object[target.property];
      return { value: method.apply(target.object, args), meta };
    }

    if (typeof target.object === "string" && target.property === "slice") {
      return { value: target.object.slice(...args), meta };
    }

    throw new Error(`Unsupported member call "${String(target.property)}".`);
  }

  throw new Error(`Unsupported callee type "${expr.callee.type}".`);
}

function evaluateExpression(expr, frame, runtime) {
  if (!expr) {
    return { value: undefined, meta: createMeta() };
  }

  switch (expr.type) {
    case "Literal":
      return { value: expr.value, meta: createMeta() };
    case "Identifier":
      return { value: resolveIdentifier(frame, runtime, expr.name), meta: createMeta() };
    case "ArrayExpression": {
      const meta = createMeta();
      const values = expr.elements.map((element) => {
        const evaluated = evaluateExpression(element, frame, runtime);
        mergeMeta(meta, evaluated.meta);
        return evaluated.value;
      });
      return { value: values, meta };
    }
    case "ObjectExpression": {
      const meta = createMeta();
      const obj = {};
      for (const property of expr.properties) {
        if (property.type !== "Property") {
          throw new Error(`Unsupported object property type "${property.type}".`);
        }
        const key =
          property.key.type === "Identifier"
            ? property.key.name
            : evaluateExpression(property.key, frame, runtime).value;
        const valueResult = evaluateExpression(property.value, frame, runtime);
        mergeMeta(meta, valueResult.meta);
        obj[key] = valueResult.value;
      }
      return { value: obj, meta };
    }
    case "MemberExpression": {
      const target = evaluateMemberTarget(expr, frame, runtime);
      if (target.object == null) {
        throw new Error("Cannot read property from null/undefined.");
      }
      return {
        value: target.object[target.property],
        meta: target.meta,
      };
    }
    case "UnaryExpression": {
      const argument = evaluateExpression(expr.argument, frame, runtime);
      const meta = argument.meta;
      switch (expr.operator) {
        case "!":
          return { value: !argument.value, meta };
        case "+":
          return { value: +argument.value, meta };
        case "-":
          return { value: -argument.value, meta };
        default:
          throw new Error(`Unsupported unary operator "${expr.operator}".`);
      }
    }
    case "BinaryExpression": {
      const left = evaluateExpression(expr.left, frame, runtime);
      const right = evaluateExpression(expr.right, frame, runtime);
      const meta = mergeMeta(left.meta, right.meta);
      if (COMPARISON_OPERATORS.has(expr.operator)) {
        meta.comparisons += 1;
      }
      switch (expr.operator) {
        case "+":
          return { value: left.value + right.value, meta };
        case "-":
          return { value: left.value - right.value, meta };
        case "*":
          return { value: left.value * right.value, meta };
        case "/":
          return { value: left.value / right.value, meta };
        case "%":
          return { value: left.value % right.value, meta };
        case "<":
          return { value: left.value < right.value, meta };
        case "<=":
          return { value: left.value <= right.value, meta };
        case ">":
          return { value: left.value > right.value, meta };
        case ">=":
          return { value: left.value >= right.value, meta };
        case "===":
          return { value: left.value === right.value, meta };
        case "!==":
          return { value: left.value !== right.value, meta };
        default:
          throw new Error(`Unsupported binary operator "${expr.operator}".`);
      }
    }
    case "LogicalExpression": {
      const left = evaluateExpression(expr.left, frame, runtime);
      if (expr.operator === "&&" && !left.value) {
        return left;
      }
      if (expr.operator === "||" && left.value) {
        return left;
      }
      const right = evaluateExpression(expr.right, frame, runtime);
      return { value: right.value, meta: mergeMeta(left.meta, right.meta) };
    }
    case "ConditionalExpression": {
      const test = evaluateExpression(expr.test, frame, runtime);
      const branch = test.value ? expr.consequent : expr.alternate;
      const branchValue = evaluateExpression(branch, frame, runtime);
      return {
        value: branchValue.value,
        meta: mergeMeta(test.meta, branchValue.meta),
      };
    }
    case "AssignmentExpression": {
      const valueResult = evaluateExpression(expr.right, frame, runtime);
      const value = valueResult.value;
      const meta = valueResult.meta;

      const current =
        expr.left.type === "Identifier"
          ? resolveIdentifier(frame, runtime, expr.left.name)
          : evaluateExpression(expr.left, frame, runtime).value;

      let nextValue = value;
      switch (expr.operator) {
        case "=":
          nextValue = value;
          break;
        case "+=":
          nextValue = current + value;
          break;
        case "-=":
          nextValue = current - value;
          break;
        case "*=":
          nextValue = current * value;
          break;
        case "/=":
          nextValue = current / value;
          break;
        case "%=":
          nextValue = current % value;
          break;
        default:
          throw new Error(`Unsupported assignment operator "${expr.operator}".`);
      }

      assignTarget(expr.left, nextValue, frame, runtime);
      return { value: nextValue, meta };
    }
    case "UpdateExpression": {
      const current =
        expr.argument.type === "Identifier"
          ? resolveIdentifier(frame, runtime, expr.argument.name)
          : evaluateExpression(expr.argument, frame, runtime).value;
      const nextValue = expr.operator === "++" ? current + 1 : current - 1;
      assignTarget(expr.argument, nextValue, frame, runtime);
      return {
        value: expr.prefix ? nextValue : current,
        meta: createMeta(),
      };
    }
    case "CallExpression":
      return evaluateCallExpression(expr, frame, runtime);
    default:
      throw new Error(`Unsupported expression type "${expr.type}".`);
  }
}

function assignTarget(target, value, frame, runtime) {
  if (target.type === "Identifier") {
    setIdentifier(frame, runtime, target.name, value);
    return { wasArrayWrite: false };
  }
  if (target.type === "MemberExpression") {
    const member = evaluateMemberTarget(target, frame, runtime);
    if (member.object == null) {
      throw new Error("Cannot write property on null/undefined.");
    }
    member.object[member.property] = value;
    const wasArrayWrite = Array.isArray(member.object) && Number.isInteger(Number(member.property));
    return { wasArrayWrite };
  }
  throw new Error(`Unsupported assignment target "${target.type}".`);
}

function applyReturnValue(callerFrame, runtime, pendingReturn, returnValue) {
  if (!pendingReturn || pendingReturn.kind === "ignore") {
    return;
  }
  if (pendingReturn.kind === "identifier") {
    setIdentifier(callerFrame, runtime, pendingReturn.name, returnValue);
    return;
  }
  if (pendingReturn.kind === "target") {
    if (pendingReturn.operator !== "=") {
      const current = evaluateExpression(pendingReturn.target, callerFrame, runtime).value;
      let nextValue = returnValue;
      switch (pendingReturn.operator) {
        case "+=":
          nextValue = current + returnValue;
          break;
        case "-=":
          nextValue = current - returnValue;
          break;
        case "*=":
          nextValue = current * returnValue;
          break;
        case "/=":
          nextValue = current / returnValue;
          break;
        case "%=":
          nextValue = current % returnValue;
          break;
        default:
          throw new Error(`Unsupported assignment operator "${pendingReturn.operator}".`);
      }
      assignTarget(pendingReturn.target, nextValue, callerFrame, runtime);
      return;
    }
    assignTarget(pendingReturn.target, returnValue, callerFrame, runtime);
  }
}

function describeInstruction(instruction) {
  switch (instruction.op) {
    case "DECLARE":
      return `Declare ${instruction.name}`;
    case "ASSIGN":
      return "Assignment";
    case "EXPR":
      return "Expression";
    case "JUMP_IF_FALSE":
      return "Conditional branch";
    case "JUMP":
      return "Jump";
    case "CALL":
      return `Call ${instruction.callee}()`;
    case "RETURN":
      return "Return";
    default:
      return instruction.op;
  }
}

function makeStepRecord({
  stepId,
  instruction,
  operation,
  beforePublic,
  afterPublic,
  meta,
  swapDelta,
}) {
  return {
    stepId,
    line: instruction?.line ?? 0,
    nodeType: instruction?.nodeType ?? "Runtime",
    operation,
    varDiff: computeVarDiff(beforePublic.variables, afterPublic.variables),
    callStackDiff: computeCallStackDiff(beforePublic.callStack, afterPublic.callStack),
    metricDiff: {
      comparisons: afterPublic.metrics.comparisons - beforePublic.metrics.comparisons,
      swaps: swapDelta,
      arrayAccesses: afterPublic.metrics.arrayAccesses - beforePublic.metrics.arrayAccesses,
    },
    vizPatch: {
      highlightedIndices: meta?.highlightedIndices ?? [],
    },
    timestamp: Date.now(),
  };
}

export function stepRuntime(runtimeInput) {
  const runtime = deepClone(runtimeInput);
  const beforePublic = snapshotPublicState(runtime);
  let instruction = null;
  let operation = "No-op";
  let meta = normalizeMeta(createMeta());
  let swapDelta = 0;

  if (runtime.error || runtime.terminated) {
    return { runtime, record: null, done: true };
  }

  try {
    let frame = getTopFrame(runtime);
    if (!frame) {
      runtime.terminated = true;
      return { runtime, record: null, done: true };
    }

    if (frame.pc >= frame.instructions.length) {
      if (frame.name === "program") {
        runtime.frames.pop();
        runtime.terminated = true;
        const afterPublic = snapshotPublicState(runtime);
        const record = makeStepRecord({
          stepId: runtime.nextStepId,
          instruction: { line: frame.instructions.at(-1)?.line ?? 0, nodeType: "ProgramEnd" },
          operation: "Program completed",
          beforePublic,
          afterPublic,
          meta,
          swapDelta: 0,
        });
        runtime.nextStepId += 1;
        runtime.lastOperation = "Program completed";
        runtime.lastVizPatch = { highlightedIndices: [] };
        runtime.lastLine = null;
        return { runtime, record, done: true };
      }

      const completedFrame = runtime.frames.pop();
      const callerFrame = getTopFrame(runtime);
      if (callerFrame?.pendingReturn) {
        applyReturnValue(callerFrame, runtime, callerFrame.pendingReturn.assignTo, undefined);
        callerFrame.pc = callerFrame.pendingReturn.nextPc;
        callerFrame.pendingReturn = null;
      }

      const afterPublic = snapshotPublicState(runtime);
      const record = makeStepRecord({
        stepId: runtime.nextStepId,
        instruction: { line: completedFrame.instructions.at(-1)?.line ?? 0, nodeType: "ImplicitReturn" },
        operation: `Implicit return from ${completedFrame.name}`,
        beforePublic,
        afterPublic,
        meta,
        swapDelta: 0,
      });
      runtime.nextStepId += 1;
      runtime.lastOperation = `Implicit return from ${completedFrame.name}`;
      runtime.lastVizPatch = { highlightedIndices: [] };
      runtime.lastLine = getCurrentLine(runtime);
      return { runtime, record, done: false };
    }

    instruction = frame.instructions[frame.pc];
    const instructionMeta = createMeta();
    operation = describeInstruction(instruction);

    switch (instruction.op) {
      case "DECLARE": {
        const initValue = instruction.init
          ? evaluateExpression(instruction.init, frame, runtime)
          : { value: undefined, meta: createMeta() };
        frame.env[instruction.name] = initValue.value;
        mergeMeta(instructionMeta, initValue.meta);
        frame.pc += 1;
        break;
      }
      case "ASSIGN": {
        const valueResult = evaluateExpression(instruction.value, frame, runtime);
        mergeMeta(instructionMeta, valueResult.meta);

        let assignedValue = valueResult.value;
        if (instruction.operator !== "=") {
          const current = evaluateExpression(instruction.target, frame, runtime);
          mergeMeta(instructionMeta, current.meta);
          switch (instruction.operator) {
            case "+=":
              assignedValue = current.value + valueResult.value;
              break;
            case "-=":
              assignedValue = current.value - valueResult.value;
              break;
            case "*=":
              assignedValue = current.value * valueResult.value;
              break;
            case "/=":
              assignedValue = current.value / valueResult.value;
              break;
            case "%=":
              assignedValue = current.value % valueResult.value;
              break;
            default:
              throw new Error(`Unsupported assignment operator "${instruction.operator}".`);
          }
        }

        const assignmentResult = assignTarget(instruction.target, assignedValue, frame, runtime);
        if (assignmentResult.wasArrayWrite) {
          runtime.metrics.swaps += 1;
          swapDelta += 1;
        }

        frame.pc += 1;
        break;
      }
      case "EXPR": {
        const exprResult = evaluateExpression(instruction.expr, frame, runtime);
        mergeMeta(instructionMeta, exprResult.meta);
        frame.pc += 1;
        break;
      }
      case "JUMP_IF_FALSE": {
        const testResult = evaluateExpression(instruction.test, frame, runtime);
        mergeMeta(instructionMeta, testResult.meta);
        if (!testResult.value) {
          frame.pc = instruction.target;
        } else {
          frame.pc += 1;
        }
        break;
      }
      case "JUMP":
        frame.pc = instruction.target;
        break;
      case "CALL": {
        const functionDefinition = runtime.functions[instruction.callee];
        if (!functionDefinition) {
          throw new Error(`Undefined function "${instruction.callee}".`);
        }

        const args = [];
        for (const argExpression of instruction.args) {
          const argResult = evaluateExpression(argExpression, frame, runtime);
          mergeMeta(instructionMeta, argResult.meta);
          args.push(argResult.value);
        }

        const calleeEnv = {};
        functionDefinition.params.forEach((paramName, index) => {
          calleeEnv[paramName] = args[index];
        });
        frame.pendingReturn = {
          assignTo: instruction.assignTo,
          nextPc: frame.pc + 1,
        };

        const calleeFrame = createFrame(
          runtime.nextFrameId,
          functionDefinition.name,
          functionDefinition.instructions,
          calleeEnv,
        );
        runtime.nextFrameId += 1;
        runtime.frames.push(calleeFrame);
        operation = `Call ${instruction.callee}(${args.map((arg) => JSON.stringify(arg)).join(", ")})`;
        break;
      }
      case "RETURN": {
        const returnResult = instruction.expr
          ? evaluateExpression(instruction.expr, frame, runtime)
          : { value: undefined, meta: createMeta() };
        mergeMeta(instructionMeta, returnResult.meta);
        const returnValue = returnResult.value;
        const returningFrame = runtime.frames.pop();
        const callerFrame = getTopFrame(runtime);
        operation = `Return from ${returningFrame.name}`;

        if (!callerFrame) {
          runtime.result = returnValue;
          runtime.terminated = true;
        } else if (callerFrame.pendingReturn) {
          applyReturnValue(callerFrame, runtime, callerFrame.pendingReturn.assignTo, returnValue);
          callerFrame.pc = callerFrame.pendingReturn.nextPc;
          callerFrame.pendingReturn = null;
        }
        break;
      }
      default:
        throw new Error(`Unsupported op "${instruction.op}".`);
    }

    runtime.metrics.comparisons += instructionMeta.comparisons;
    runtime.metrics.arrayAccesses += instructionMeta.arrayAccesses;
    meta = normalizeMeta(instructionMeta);
    runtime.lastVizPatch = { highlightedIndices: meta.highlightedIndices };
    runtime.lastOperation = operation;
    runtime.lastLine = getCurrentLine(runtime);

    const afterPublic = snapshotPublicState(runtime);
    const record = makeStepRecord({
      stepId: runtime.nextStepId,
      instruction,
      operation,
      beforePublic,
      afterPublic,
      meta,
      swapDelta,
    });
    runtime.nextStepId += 1;

    return {
      runtime,
      record,
      done: runtime.terminated,
    };
  } catch (error) {
    runtime.error = error.message;
    runtime.terminated = true;
    const afterPublic = snapshotPublicState(runtime);
    const record = makeStepRecord({
      stepId: runtime.nextStepId,
      instruction,
      operation: `Runtime error: ${error.message}`,
      beforePublic,
      afterPublic,
      meta,
      swapDelta,
    });
    runtime.nextStepId += 1;
    return {
      runtime,
      record,
      done: true,
      error: error.message,
    };
  }
}

export function replay(compiledProgram, toStep, fromRuntime = null) {
  let runtime = fromRuntime ? deepClone(fromRuntime) : createRuntime(compiledProgram);
  const records = [];
  for (let index = 0; index < toStep; index += 1) {
    if (runtime.terminated || runtime.error) {
      break;
    }
    const stepResult = stepRuntime(runtime);
    runtime = stepResult.runtime;
    if (stepResult.record) {
      records.push(stepResult.record);
    }
  }
  return { runtime, stepRecords: records };
}

export function estimateTotalSteps(compiledProgram, maxSteps = 5000) {
  let runtime = createRuntime(compiledProgram);
  let steps = 0;
  while (!runtime.terminated && !runtime.error && steps < maxSteps) {
    const result = stepRuntime(runtime);
    runtime = result.runtime;
    steps += 1;
  }
  if (steps === maxSteps && !runtime.terminated) {
    return maxSteps;
  }
  return steps;
}

export function getCurrentLine(runtime) {
  if (!runtime || runtime.terminated || runtime.frames.length === 0) {
    return null;
  }
  const frame = getTopFrame(runtime);
  if (!frame || frame.pc >= frame.instructions.length) {
    return null;
  }
  return frame.instructions[frame.pc].line;
}

export function getInspectableState(runtime) {
  const snapshot = snapshotPublicState(runtime);
  return {
    variables: snapshot.variables,
    callStack: snapshot.callStack,
    metrics: snapshot.metrics,
    highlightedIndices: runtime.lastVizPatch?.highlightedIndices ?? [],
    currentOperation: runtime.lastOperation ?? "",
    currentLine: runtime.lastLine ?? null,
  };
}

export function getNearestSnapshotStep(targetStep, snapshots) {
  const availableSteps = Object.keys(snapshots)
    .map((value) => Number(value))
    .filter((step) => step <= targetStep)
    .sort((a, b) => b - a);
  return availableSteps[0] ?? 0;
}
