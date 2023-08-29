import _ from "lodash";
import {
    AddSubtractContext,
    AssignmentStatementContext,
    BlockStatementContext,
    ConjunctionContext,
    DisjunctionContext,
    EqualityComparisonContext,
    FunctionCallContext,
    IdentifierContext,
    IfStatementContext,
    LiteralContext,
    LogicalNotContext,
    MultiplyDivideModuloContext,
    NonEqualityComparisonContext,
    ParenthesisContext,
    ProgContext,
    StatementContext,
    UnaryPlusMinusContext,
} from "./GrammarParser";
import GrammarVisitor from "./GrammarVisitor";
import mathStdlib from "@stdlib/stdlib";

export type QuestionReturnType = number | string | boolean | void;
const DEFAULT_EPS = 1e-9;

export default class QuestionGrammarVisitor extends GrammarVisitor<QuestionReturnType> {
    private symbols: Map<string, QuestionReturnType>;

    constructor() {
        super();
        this.symbols = new Map<string, QuestionReturnType>();
        // define some mathematical constants
        this.symbols.set("PI", Math.PI);
        this.symbols.set("E", Math.E);
    }

    visitProg = (ctx: ProgContext): QuestionReturnType => {
        const statementsContexts = ctx.statement_list();
        for (const context of statementsContexts) {
            this.visit(context);
        }
        return;
    };

    visitStatement = (ctx: StatementContext): QuestionReturnType => {
        if (ctx.assignmentStatement()) {
            this.visit(ctx.assignmentStatement());
        } else if (ctx.ifStatement()) {
            this.visit(ctx.ifStatement());
        } else if (ctx.blockStatement()) {
            this.visit(ctx.blockStatement());
        } else {
            throw new Error(`Unknown statement type ${ctx.getText()}`);
        }
    };

    visitBlockStatement = (ctx: BlockStatementContext): QuestionReturnType => {
        const statementsContexts = ctx.statement_list();
        for (const context of statementsContexts) {
            this.visit(context);
        }
    };

    visitUnaryPlusMinus = (ctx: UnaryPlusMinusContext): QuestionReturnType => {
        const expr = this.visit(ctx.expr());
        if (typeof expr !== "number") {
            throw new Error(
                `Unary plus/minus cannot be used with type '${typeof expr}'`
            );
        }
        const value = expr as number;
        return ctx.PLUS() ? value : -value;
    };

    visitLiteral = (ctx: LiteralContext): QuestionReturnType => {
        if (ctx.STRING()) {
            return ctx.STRING().getText().slice(1, -1); // remove first and last character
        } else if (ctx.NUM()) {
            return parseFloat(ctx.NUM().getText());
        } else if (ctx.BOOLEAN()) {
            return ctx.BOOLEAN().getText() === "true";
        } else {
            throw new Error(`Unknown token ${ctx.getText()}`);
        }
    };

    visitIdentifier = (ctx: IdentifierContext): QuestionReturnType => {
        const id = ctx.ID().getText();
        if (!this.symbols.has(id)) {
            throw new Error(`Unknown identifier '${id}'`);
        }
        return this.symbols.get(id);
    };

    visitLogicalNot = (ctx: LogicalNotContext): QuestionReturnType => {
        if (!ctx.EXCLAM()) {
            throw new Error(`Missing '!' for logical not operator`);
        }
        const exprCtx = ctx.expr();
        if (!exprCtx) {
            throw new Error(`Missing expression for logical not operator`);
        }
        const expr = this.visit(exprCtx);
        switch (typeof expr) {
            case "number": {
                return Math.abs(expr as number) < DEFAULT_EPS;
            }
            case "boolean": {
                return !(expr as boolean);
            }
            case "string": {
                throw new Error(
                    `Logical not cannot be used with type '${typeof expr}'`
                );
            }
            default: {
                throw new Error(
                    `Logical not cannot be used with type '${typeof expr}'`
                );
            }
        }
    };

    visitMultiplyDivideModulo = (
        ctx: MultiplyDivideModuloContext
    ): QuestionReturnType => {
        const exprList = ctx.expr_list();
        const [arg1, arg2] = [this.visit(exprList[0]), this.visit(exprList[1])];
        const operator =
            ctx.ASTERISK()?.getText() ??
            ctx.SLASH()?.getText() ??
            ctx.PERCENT()?.getText();
        if (typeof arg1 !== "number" || typeof arg2 !== "number") {
            throw new Error(
                `Operands to '${operator}' must be of type 'number'. Received '${typeof arg1}' and '${typeof arg2}'`
            );
        }
        const [lhs, rhs] = [arg1 as number, arg2 as number];
        if (operator === ctx.ASTERISK()?.getText()) {
            return lhs * rhs;
        } else if (operator === ctx.SLASH()?.getText()) {
            return lhs / rhs;
        } else if (operator === ctx.PERCENT()?.getText()) {
            return lhs % rhs;
        } else {
            throw new Error(`Unknown operator '${operator}'`);
        }
    };

    visitDisjunction = (ctx: DisjunctionContext): QuestionReturnType => {
        const exprList = ctx.expr_list();
        const [lhs, rhs] = [this.visit(exprList[0]), this.visit(exprList[1])];
        if (typeof lhs !== "boolean" || typeof rhs !== "boolean") {
            throw new Error(
                `Operands to '||' must be of type 'boolean'. Received '${typeof lhs}' and '${typeof rhs}'`
            );
        }
        return (lhs as boolean) || (rhs as boolean);
    };

    visitAssignmentStatement = (
        ctx: AssignmentStatementContext
    ): QuestionReturnType => {
        const id = ctx.ID()?.getText();
        const expr = this.visit(ctx.expr());
        this.symbols.set(id, expr);
        return expr;
    };

    visitEqualityComparison = (
        ctx: EqualityComparisonContext
    ): QuestionReturnType => {
        const exprList = ctx.expr_list();
        const [lhs, rhs] = [this.visit(exprList[0]), this.visit(exprList[1])];
        const operator = ctx.EXCLAM() ? "!=" : "==";
        if (typeof lhs !== typeof rhs) {
            throw new Error(
                `Operands to '${operator}' are of different types (${typeof lhs} and ${typeof rhs})`
            );
        }
        if (ctx.EXCLAM()) {
            // not equal
            return typeof lhs === "number"
                ? Math.abs((lhs as number) - (rhs as number)) > DEFAULT_EPS
                : lhs !== rhs;
        } else {
            // equal
            return typeof lhs === "number"
                ? Math.abs((lhs as number) - (rhs as number)) <= DEFAULT_EPS
                : lhs === rhs;
        }
    };

    visitAddSubtract = (ctx: AddSubtractContext): QuestionReturnType => {
        const exprList = ctx.expr_list();
        const [arg1, arg2] = [this.visit(exprList[0]), this.visit(exprList[1])];
        const operator = ctx.PLUS()?.getText() ?? ctx.MINUS()?.getText();
        if (typeof arg1 !== "number" || typeof arg2 !== "number") {
            throw new Error(
                `Operands to '${operator}' must be of type 'number'. Received '${typeof arg1}' and '${typeof arg2}'`
            );
        }
        const [lhs, rhs] = [arg1 as number, arg2 as number];
        return operator === ctx.PLUS()?.getText() ? lhs + rhs : lhs - rhs;
    };

    visitNonEqualityComparison = (
        ctx: NonEqualityComparisonContext
    ): QuestionReturnType => {
        const exprList = ctx.expr_list();
        const [arg1, arg2] = [this.visit(exprList[0]), this.visit(exprList[1])];
        const operator =
            (ctx.GREATER()?.getText() ?? ctx.LESS()?.getText()) +
            (ctx.EQUAL()?.getText() ?? "");
        if (typeof arg1 !== "number" || typeof arg2 !== "number") {
            throw new Error(
                `Operands to '${operator}' must be of type 'number'. Received '${typeof arg1}' and '${typeof arg2}'`
            );
        }
        const [lhs, rhs] = [arg1 as number, arg2 as number];
        if (ctx.GREATER()) {
            return ctx.EQUAL()
                ? lhs - rhs >= -DEFAULT_EPS
                : lhs - rhs > DEFAULT_EPS;
        } else {
            return ctx.EQUAL()
                ? lhs - rhs <= DEFAULT_EPS
                : lhs - rhs < -DEFAULT_EPS;
        }
    };

    visitParenthesis = (ctx: ParenthesisContext): QuestionReturnType => {
        return this.visit(ctx.expr());
    };

    visitConjunction = (ctx: ConjunctionContext): QuestionReturnType => {
        const exprList = ctx.expr_list();
        const [lhs, rhs] = [this.visit(exprList[0]), this.visit(exprList[1])];
        if (typeof lhs !== "boolean" || typeof rhs !== "boolean") {
            throw new Error(
                `Operands to '&&' must be of type 'boolean'. Received '${typeof lhs}' and '${typeof rhs}'`
            );
        }
        return (lhs as boolean) && (rhs as boolean);
    };

    visitFunctionCall = (ctx: FunctionCallContext): QuestionReturnType => {
        const isInt = (value: number) => {
            return Math.abs(value - Math.round(value)) <= DEFAULT_EPS;
        };

        const funcName = ctx.ID().getText();
        const exprList = ctx.expr_list();
        switch (funcName) {
            case "boolean": {
                if (exprList.length !== 1) {
                    throw new Error(
                        `'boolean' expects exactly one argument, received ${exprList.length}`
                    );
                }
                const arg = this.visit(exprList[0]);
                if (typeof arg === "boolean") return arg;
                else if (typeof arg === "number") return arg !== 0;
                else if (typeof arg === "string")
                    throw new Error(
                        `Conversion from 'string' to 'boolean' is not allowed`
                    );
                else
                    throw new Error(
                        `Unknown type ${typeof arg} used in function 'boolean'`
                    );
            }
            case "number": {
                if (exprList.length !== 1) {
                    throw new Error(
                        `'number' expects exactly one argument, received ${exprList.length}`
                    );
                }
                const arg = this.visit(exprList[0]);
                if (typeof arg === "boolean") return arg ? 1 : 0;
                else if (typeof arg === "number") return arg;
                else if (typeof arg === "string")
                    return parseFloat(arg as string);
                else
                    throw new Error(
                        `Unknown type ${typeof arg} used in function 'number'`
                    );
            }
            case "string": {
                if (exprList.length !== 1) {
                    throw new Error(
                        `'string' expects exactly one argument, received ${exprList.length}`
                    );
                }
                const arg = this.visit(exprList[0]);
                if (typeof arg === "boolean")
                    return (arg as boolean) ? "true" : "false";
                else if (typeof arg === "number")
                    return (arg as number).toString();
                else if (typeof arg === "string") return arg;
                else
                    throw new Error(
                        `Unknown type ${typeof arg} used in function 'string'`
                    );
            }
            case "rand": {
                if (exprList.length !== 2) {
                    throw new Error(
                        `'rand' expects exactly one argument, received ${exprList.length}`
                    );
                }
                const [from, to] = [
                    this.visit(exprList[0]),
                    this.visit(exprList[1]),
                ];
                if (typeof from !== "number" || typeof to !== "number") {
                    throw new Error(
                        `Both parameters to 'rand' must be of type 'number', received ${typeof from} and ${typeof to}`
                    );
                }
                const [f, t] = [
                    Math.ceil(from as number),
                    Math.floor(to as number),
                ];
                if (f > t) {
                    throw new Error(`'from' is greater than 'to' in 'rand'`);
                }
                return _.random(f, t, false);
            }
            case "rrand": {
                if (exprList.length !== 2) {
                    throw new Error(
                        `'rrand' expects exactly one argument, received ${exprList.length}`
                    );
                }
                const [from, to] = [
                    this.visit(exprList[0]),
                    this.visit(exprList[1]),
                ];
                if (typeof from !== "number" || typeof to !== "number") {
                    throw new Error(
                        `Both parameters to 'rrand' must be of type 'number', received ${typeof from} and ${typeof to}`
                    );
                }
                if (from > to) {
                    throw new Error(`'from' is greater than 'to' in 'rrand'`);
                }
                return _.random(from, to, true);
            }
            case "choice": {
                if (exprList.length === 0) {
                    throw new Error(`Sequence to choose from is empty`);
                }
                const items = exprList.map((x) => this.visit(x));
                return items[Math.floor(Math.random() * exprList.length)];
            }
            case "round": {
                if (exprList.length !== 2) {
                    throw new Error(
                        `'round' expects exactly one argument, received ${exprList.length}`
                    );
                }
                const [num, n] = [
                    this.visit(exprList[0]),
                    this.visit(exprList[1]),
                ];
                if (typeof num !== "number" || typeof n !== "number") {
                    throw new Error(
                        `Both parameters to 'round' must be of type 'number', received ${typeof num} and ${typeof n}`
                    );
                }
                let m = 1;
                for (let i = 1; i <= n; i++) {
                    m *= 10;
                }
                return Math.round(num * m) / m;
            }
            case "sin": {
                if (exprList.length !== 1) {
                    throw new Error(
                        `'sin' expects exactly one argument, received ${exprList.length}`
                    );
                }
                const [x] = [this.visit(exprList[0])];
                if (typeof x !== "number") {
                    throw new Error(
                        `'sin' expects to receive a number argument, received '${typeof x}'`
                    );
                }
                return Math.sin(x as number);
            }
            case "cos": {
                if (exprList.length !== 1) {
                    throw new Error(
                        `'cos' expects exactly one argument, received ${exprList.length}`
                    );
                }
                const [x] = [this.visit(exprList[0])];
                if (typeof x !== "number") {
                    throw new Error(
                        `'cos' expects to receive a number argument, received '${typeof x}'`
                    );
                }
                return Math.cos(x as number);
            }
            case "tan": {
                if (exprList.length !== 1) {
                    throw new Error(
                        `'tan' expects exactly one argument, received ${exprList.length}`
                    );
                }
                const [x] = [this.visit(exprList[0])];
                if (typeof x !== "number") {
                    throw new Error(
                        `'tan' expects to receive a number argument, received '${typeof x}'`
                    );
                }
                if (Math.abs(Math.cos(x as number)) <= DEFAULT_EPS) {
                    throw new Error(
                        `Math error: cos(${
                            x as number
                        }) = 0, so tan is undefined`
                    );
                }
                return Math.tan(x as number);
            }
            case "sec": {
                if (exprList.length !== 1) {
                    throw new Error(
                        `'sec' expects exactly one argument, received ${exprList.length}`
                    );
                }
                const [x] = [this.visit(exprList[0])];
                if (typeof x !== "number") {
                    throw new Error(
                        `'sec' expects to receive a number argument, received '${typeof x}'`
                    );
                }
                if (Math.abs(Math.cos(x as number)) <= DEFAULT_EPS) {
                    throw new Error(
                        `Math error: cos(${
                            x as number
                        }) = 0, so sec is undefined`
                    );
                }
                return 1 / Math.cos(x as number);
            }
            case "csc": {
                if (exprList.length !== 1) {
                    throw new Error(
                        `'csc' expects exactly one argument, received ${exprList.length}`
                    );
                }
                const [x] = [this.visit(exprList[0])];
                if (typeof x !== "number") {
                    throw new Error(
                        `'csc' expects to receive a number argument, received '${typeof x}'`
                    );
                }
                if (Math.abs(Math.sin(x as number)) <= DEFAULT_EPS) {
                    throw new Error(
                        `Math error: sin(${
                            x as number
                        }) = 0, so csc is undefined`
                    );
                }
                return 1 / Math.sin(x as number);
            }
            case "cot": {
                if (exprList.length !== 1) {
                    throw new Error(
                        `'cot' expects exactly one argument, received ${exprList.length}`
                    );
                }
                const [x] = [this.visit(exprList[0])];
                if (typeof x !== "number") {
                    throw new Error(
                        `'cot' expects to receive a number argument, received '${typeof x}'`
                    );
                }
                if (Math.abs(Math.sin(x as number)) <= DEFAULT_EPS) {
                    throw new Error(
                        `Math error: sin(${
                            x as number
                        }) = 0, so cot is undefined`
                    );
                }
                return Math.cos(x as number) / Math.sin(x as number);
            }
            case "arcsin": {
                if (exprList.length !== 1) {
                    throw new Error(
                        `'arcsin' expects exactly one argument, received ${exprList.length}`
                    );
                }
                const [x] = [this.visit(exprList[0])];
                if (typeof x !== "number") {
                    throw new Error(
                        `'arcsin' expects to receive a number argument, received '${typeof x}'`
                    );
                }
                let num = x as number;
                if (num < -1 - DEFAULT_EPS || num > 1 + DEFAULT_EPS) {
                    throw new Error(
                        `Argument to 'arcsin' should be in range [-1, 1] (received ${num})`
                    );
                }
                num = _.clamp(num, -1, 1);
                return Math.asin(num);
            }
            case "arccos": {
                if (exprList.length !== 1) {
                    throw new Error(
                        `'arccos' expects exactly one argument, received ${exprList.length}`
                    );
                }
                const [x] = [this.visit(exprList[0])];
                if (typeof x !== "number") {
                    throw new Error(
                        `'arccos' expects to receive a number argument, received '${typeof x}'`
                    );
                }
                let num = x as number;
                if (num < -1 - DEFAULT_EPS || num > 1 + DEFAULT_EPS) {
                    throw new Error(
                        `Argument to 'arccos' should be in range [-1, 1] (received ${num})`
                    );
                }
                num = _.clamp(num, -1, 1);
                return Math.acos(num);
            }
            case "arctan": {
                if (exprList.length !== 1) {
                    throw new Error(
                        `'arctan' expects exactly one argument, received ${exprList.length}`
                    );
                }
                const [x] = [this.visit(exprList[0])];
                if (typeof x !== "number") {
                    throw new Error(
                        `'arctan' expects to receive a number argument, received '${typeof x}'`
                    );
                }
                const num = x as number;
                return Math.atan(num);
            }
            case "atan2": {
                if (exprList.length !== 2) {
                    throw new Error(
                        `'atan2' expects exactly two arguments, received ${exprList.length}`
                    );
                }
                const [arg1, arg2] = [
                    this.visit(exprList[0]),
                    this.visit(exprList[1]),
                ];
                if (typeof arg1 !== "number" || typeof arg2 !== "number") {
                    throw new Error(
                        `Both arguments to 'atan2' should be of type 'number'. Received '${typeof arg1}' and '${typeof arg2}'`
                    );
                }
                const [y, x] = [arg1 as number, arg2 as number];
                if (Math.abs(x) <= DEFAULT_EPS && Math.abs(y) <= DEFAULT_EPS) {
                    throw new Error(
                        `(0, 0) is undefined for 'atan2'. Received (${y}, ${x})`
                    );
                }
                return Math.atan2(y, x);
            }
            case "abs": {
                if (exprList.length !== 1) {
                    throw new Error(
                        `'abs' expects exactly one argument, received ${exprList.length}`
                    );
                }
                const [arg1] = [this.visit(exprList[0])];
                if (typeof arg1 !== "number") {
                    throw new Error(
                        `'abs' expects to receive a number argument, receive ${typeof arg1}`
                    );
                }
                const [x] = [arg1 as number];
                return Math.abs(x);
            }
            case "floor": {
                if (exprList.length !== 1) {
                    throw new Error(
                        `'floor' expects exactly one argument, received ${exprList.length}`
                    );
                }
                const [arg1] = [this.visit(exprList[0])];
                if (typeof arg1 !== "number") {
                    throw new Error(
                        `'floor' expects to receive a number argument, received ${typeof arg1}`
                    );
                }
                const [x] = [arg1 as number];
                return Math.floor(x);
            }
            case "ceil": {
                if (exprList.length !== 1) {
                    throw new Error(
                        `'ceil' expects exactly one argument, received ${exprList.length}`
                    );
                }
                const [arg1] = [this.visit(exprList[0])];
                if (typeof arg1 !== "number") {
                    throw new Error(
                        `'ceil' expects to receive a number argument, received ${typeof arg1}`
                    );
                }
                const [x] = [arg1 as number];
                return Math.ceil(x);
            }
            case "sqrt": {
                if (exprList.length !== 1) {
                    throw new Error(
                        `'sqrt' expects exactly one argument, received ${exprList.length}`
                    );
                }
                const [arg1] = [this.visit(exprList[0])];
                if (typeof arg1 !== "number") {
                    throw new Error(
                        `'sqrt' expects to receive a number argument, received ${typeof arg1}`
                    );
                }
                let [x] = [arg1 as number];
                if (x < -DEFAULT_EPS) {
                    throw new Error(
                        `'sqrt' expects to receive a non-negative number, received ${x}`
                    );
                }
                x = Math.max(x, 0);
                return Math.sqrt(x);
            }
            case "ln": {
                if (exprList.length !== 1) {
                    throw new Error(
                        `'ln' expects exactly one argument, received ${exprList.length}`
                    );
                }
                const [arg1] = [this.visit(exprList[0])];
                if (typeof arg1 !== "number") {
                    throw new Error(
                        `'ln' expects to receive a number argument, received ${typeof arg1}`
                    );
                }
                const [x] = [arg1 as number];
                if (x <= DEFAULT_EPS) {
                    throw new Error(
                        `'ln' expects to receive a positive number, received ${x}`
                    );
                }
                return Math.log(x);
            }
            case "log10": {
                if (exprList.length !== 1) {
                    throw new Error(
                        `'log10' expects exactly one argument, received ${exprList.length}`
                    );
                }
                const [arg1] = [this.visit(exprList[0])];
                if (typeof arg1 !== "number") {
                    throw new Error(
                        `'log10' expects to receive a number argument, received ${typeof arg1}`
                    );
                }
                const [x] = [arg1 as number];
                if (x <= DEFAULT_EPS) {
                    throw new Error(
                        `'log10' expects to receive a positive number, received ${x}`
                    );
                }
                return Math.log10(x);
            }
            case "log2": {
                if (exprList.length !== 1) {
                    throw new Error(
                        `'log2' expects exactly one argument, received ${exprList.length}`
                    );
                }
                const [arg1] = [this.visit(exprList[0])];
                if (typeof arg1 !== "number") {
                    throw new Error(
                        `'log2' expects to receive a number argument, received ${typeof arg1}`
                    );
                }
                const [x] = [arg1 as number];
                if (x <= DEFAULT_EPS) {
                    throw new Error(
                        `'log2' expects to receive a positive number, received ${x}`
                    );
                }
                return Math.log2(x);
            }
            case "pow": {
                if (exprList.length !== 2) {
                    throw new Error(
                        `'pow' expects exactly two arguments, received ${exprList.length}`
                    );
                }
                const [arg1, arg2] = [
                    this.visit(exprList[0]),
                    this.visit(exprList[1]),
                ];
                if (typeof arg1 !== "number" || typeof arg2 !== "number") {
                    throw new Error(
                        `Both arguments to 'pow' should be of type 'number'. Received '${typeof arg1}' and '${typeof arg2}'`
                    );
                }
                const [x, y] = [arg1 as number, arg2 as number];
                if (Math.abs(x) <= DEFAULT_EPS && Math.abs(y) <= DEFAULT_EPS) {
                    throw new Error(
                        `(0, 0) is undefined for 'pow'. Received (${x}, ${y})`
                    );
                }
                return Math.pow(x, y);
            }
            case "sgn": {
                if (exprList.length !== 1) {
                    throw new Error(
                        `'sgn' expects exactly one argument, received ${exprList.length}`
                    );
                }
                const [arg1] = [this.visit(exprList[0])];
                if (typeof arg1 !== "number") {
                    throw new Error(
                        `'sgn' expects to receive a number argument, received ${typeof arg1}`
                    );
                }
                const [x] = [arg1 as number];
                if (Math.abs(x) <= DEFAULT_EPS) {
                    return 0;
                }
                return Math.sign(x);
            }
            case "exp": {
                if (exprList.length !== 1) {
                    throw new Error(
                        `'exp' expects exactly one argument, received ${exprList.length}`
                    );
                }
                const [arg1] = [this.visit(exprList[0])];
                if (typeof arg1 !== "number") {
                    throw new Error(
                        `'exp' expects to receive a number argument, received ${typeof arg1}`
                    );
                }
                const [x] = [arg1 as number];
                return Math.exp(x);
            }
            case "factorial": {
                if (exprList.length !== 1) {
                    throw new Error(
                        `'factorial' expects exactly one argument, received ${exprList.length}`
                    );
                }
                const [arg1] = [this.visit(exprList[0])];
                if (typeof arg1 !== "number") {
                    throw new Error(
                        `'factorial' expects to receive a number argument, received ${typeof arg1}`
                    );
                }
                const [x] = [arg1 as number];
                if (x < -DEFAULT_EPS) {
                    throw new Error(
                        `'factorial' expects to receive a non-negative number, received ${x}`
                    );
                }
                if (!isInt(x)) {
                    throw new Error(
                        `'factorial' expects to receive an integer, received ${x}`
                    );
                }
                const num = Math.round(x);
                return mathStdlib.math.base.special.factorial(num);
            }
            case "combinations": {
                if (exprList.length !== 2) {
                    throw new Error(
                        `'combinations' expects exactly two arguments, received ${exprList.length}`
                    );
                }
                const [arg1, arg2] = [
                    this.visit(exprList[0]),
                    this.visit(exprList[1]),
                ];
                if (typeof arg1 !== "number" || typeof arg2 !== "number") {
                    throw new Error(
                        `Both arguments to 'combinations' should be of type 'number'. Received '${typeof arg1}' and '${typeof arg2}'`
                    );
                }
                const [n, k] = [arg1 as number, arg2 as number];
                if (n < -DEFAULT_EPS || k < -DEFAULT_EPS) {
                    throw new Error(
                        `'combinations' expects to receive non-negative numbers, received (${n}, ${k})`
                    );
                }
                if (!isInt(n) || !isInt(k)) {
                    throw new Error(
                        `'combinations' expects to receive integers, received (${n}, ${k})`
                    );
                }
                const [nInt, kInt] = [Math.round(n), Math.round(k)];
                if (!(nInt >= kInt)) {
                    throw new Error(
                        `'combinations' expects to receive n >= k, received (${nInt}, ${kInt})`
                    );
                }
                return mathStdlib.math.base.special.binomcoef(nInt, kInt);
            }
            case "combinationsWithRep": {
                if (exprList.length !== 2) {
                    throw new Error(
                        `'combinationsWithRep' expects exactly two arguments, received ${exprList.length}`
                    );
                }
                const [arg1, arg2] = [
                    this.visit(exprList[0]),
                    this.visit(exprList[1]),
                ];
                if (typeof arg1 !== "number" || typeof arg2 !== "number") {
                    throw new Error(
                        `Both arguments to 'combinationsWithRep' should be of type 'number'. Received '${typeof arg1}' and '${typeof arg2}'`
                    );
                }
                const [n, k] = [arg1 as number, arg2 as number];
                if (n < -DEFAULT_EPS || k < -DEFAULT_EPS) {
                    throw new Error(
                        `'combinationsWithRep' expects to receive non-negative numbers, received (${n}, ${k})`
                    );
                }
                if (!isInt(n) || !isInt(k)) {
                    throw new Error(
                        `'combinationsWithRep' expects to receive integers, received (${n}, ${k})`
                    );
                }
                const [nInt, kInt] = [Math.round(n), Math.round(k)];
                if (!(nInt + kInt - 1 >= kInt)) {
                    throw new Error(
                        `'combinationsWithRep' expects to receive n + k - 1 >= k. n = ${n}, k = ${k} does not satisfy this`
                    );
                }
                return mathStdlib.math.base.special.binomcoef(
                    nInt + kInt - 1,
                    kInt
                );
            }
            case "permutations": {
                if (exprList.length !== 2) {
                    throw new Error(
                        `'permutations' expects exactly two arguments, received ${exprList.length}`
                    );
                }
                const [arg1, arg2] = [
                    this.visit(exprList[0]),
                    this.visit(exprList[1]),
                ];
                if (typeof arg1 !== "number" || typeof arg2 !== "number") {
                    throw new Error(
                        `Both arguments to 'permutations' should be of type 'number'. Received '${typeof arg1}' and '${typeof arg2}'`
                    );
                }
                const [n, k] = [arg1 as number, arg2 as number];
                if (n < -DEFAULT_EPS || k < -DEFAULT_EPS) {
                    throw new Error(
                        `'permutations' expects to receive non-negative numbers, received (${n}, ${k})`
                    );
                }
                if (!isInt(n) || !isInt(k)) {
                    throw new Error(
                        `'permutations' expects to receive integers, received (${n}, ${k})`
                    );
                }
                const [nInt, kInt] = [Math.round(n), Math.round(k)];
                if (!(nInt >= kInt)) {
                    throw new Error(
                        `'permutations' expects to receive n >= k, received (${nInt}, ${kInt})`
                    );
                }
                return (
                    mathStdlib.math.base.special.binomcoef(nInt, kInt) *
                    mathStdlib.math.base.special.factorial(kInt)
                );
            }
            case "max": {
                if (exprList.length === 0) {
                    throw new Error(`'max' expects at least one argument`);
                }
                const items = _.map(exprList, (x) => this.visit(x));
                if (_.some(items, (x) => typeof x !== "number")) {
                    throw new Error(`'max' expects to receive only numbers`);
                }
                return _.max(items);
            }
            case "min": {
                if (exprList.length === 0) {
                    throw new Error(`'min' expects at least one argument`);
                }
                const items = _.map(exprList, (x) => this.visit(x));
                if (_.some(items, (x) => typeof x !== "number")) {
                    throw new Error(`'min' expects to receive only numbers`);
                }
                return _.min(items);
            }
            case "normalCdf": {
                if (exprList.length !== 3) {
                    throw new Error(
                        `'normalCdf' expects exactly one argument, received ${exprList.length}`
                    );
                }
                const [arg1, arg2, arg3] = [
                    this.visit(exprList[0]),
                    this.visit(exprList[1]),
                    this.visit(exprList[2]),
                ];
                if (
                    typeof arg1 !== "number" ||
                    typeof arg2 !== "number" ||
                    typeof arg3 !== "number"
                ) {
                    throw new Error(
                        `'normalCdf' expects to receive three number arguments, received ${typeof arg1}, ${typeof arg2} and ${typeof arg3}`
                    );
                }
                const [x, mean, std] = [
                    arg1 as number,
                    arg2 as number,
                    arg3 as number,
                ];
                return mathStdlib.stats.base.dists.normal.cdf(x, mean, std);
            }
            case "normalQuantile": {
                if (exprList.length !== 3) {
                    throw new Error(
                        `'normalQuantile' expects exactly one argument, received ${exprList.length}`
                    );
                }
                const [arg1, arg2, arg3] = [
                    this.visit(exprList[0]),
                    this.visit(exprList[1]),
                    this.visit(exprList[2]),
                ];
                if (typeof arg1 !== "number") {
                    throw new Error(
                        `'normalQuantile' expects to receive a number argument, received ${typeof arg1}`
                    );
                }
                let p = arg1 as number;
                const [mean, std] = [arg2 as number, arg3 as number];
                if (p < -DEFAULT_EPS || p > 1 + DEFAULT_EPS) {
                    throw new Error(
                        `'normalQuantile' expects to receive a number in range [-1, 1], received ${p}`
                    );
                }
                p = _.clamp(p, 0, 1);
                return mathStdlib.stats.base.dists.normal.quantile(
                    p,
                    mean,
                    std
                );
            }
            case "tCdf": {
                if (exprList.length !== 2) {
                    throw new Error(
                        `'tCdf' expects exactly two arguments, received ${exprList.length}`
                    );
                }
                const [arg1, arg2] = [
                    this.visit(exprList[0]),
                    this.visit(exprList[1]),
                ];
                if (typeof arg1 !== "number" || typeof arg2 !== "number") {
                    throw new Error(
                        `'tCdf' expects to receive two number arguments, received ${typeof arg1} and ${typeof arg2}`
                    );
                }
                const [x, v] = [arg1 as number, arg2 as number];
                if (!isInt(v)) {
                    throw new Error(
                        `'tCdf' expects to receive an integer as second argument, received ${v}`
                    );
                }
                const degreeOfFreedom = Math.round(v);
                if (degreeOfFreedom < 1) {
                    throw new Error(
                        `'tCdf' expects to receive a positive integer as second argument, received ${degreeOfFreedom}`
                    );
                }
                return mathStdlib.stats.base.dists.t.cdf(x, degreeOfFreedom);
            }
            case "tQuantile": {
                if (exprList.length !== 2) {
                    throw new Error(
                        `'tQuantile' expects exactly two arguments, received ${exprList.length}`
                    );
                }
                const [arg1, arg2] = [
                    this.visit(exprList[0]),
                    this.visit(exprList[1]),
                ];
                if (typeof arg1 !== "number" || typeof arg2 !== "number") {
                    throw new Error(
                        `'tQuantile' expects to receive two number arguments, received ${typeof arg1} and ${typeof arg2}`
                    );
                }
                let p = arg1 as number;
                const v = arg2 as number;
                if (!isInt(v)) {
                    throw new Error(
                        `'tQuantile' expects to receive an integer as second argument, received ${v}`
                    );
                }
                const degreeOfFreedom = Math.round(v);
                if (degreeOfFreedom < 1) {
                    throw new Error(
                        `'tQuantile' expects to receive a positive integer as second argument, received ${degreeOfFreedom}`
                    );
                }
                if (p < -DEFAULT_EPS || p > 1 + DEFAULT_EPS) {
                    throw new Error(
                        `'tQuantile' expects to receive a number in range [0, 1], received ${p}`
                    );
                }
                p = _.clamp(p, 0, 1);
                return mathStdlib.stats.base.dists.t.quantile(
                    p,
                    degreeOfFreedom
                );
            }
            case "fCdf": {
                if (exprList.length !== 3) {
                    throw new Error(
                        `'fCdf' expects exactly three arguments, received ${exprList.length}`
                    );
                }
                const [arg1, arg2, arg3] = [
                    this.visit(exprList[0]),
                    this.visit(exprList[1]),
                    this.visit(exprList[2]),
                ];
                if (
                    typeof arg1 !== "number" ||
                    typeof arg2 !== "number" ||
                    typeof arg3 !== "number"
                ) {
                    throw new Error(
                        `'fCdf' expects to receive three number arguments, received ${typeof arg1}, ${typeof arg2} and ${typeof arg3}`
                    );
                }
                const [x, v1, v2] = [
                    arg1 as number,
                    arg2 as number,
                    arg3 as number,
                ];
                if (!isInt(v1) || !isInt(v2)) {
                    throw new Error(
                        `'fCdf' expects to receive two integers as second and third arguments, received ${v1} and ${v2}`
                    );
                }
                const [degreeOfFreedom1, degreeOfFreedom2] = [
                    Math.round(v1),
                    Math.round(v2),
                ];
                if (degreeOfFreedom1 < 1 || degreeOfFreedom2 < 1) {
                    throw new Error(
                        `'fCdf' expects to receive two positive integers as second and third arguments, received ${degreeOfFreedom1} and ${degreeOfFreedom2}`
                    );
                }
                return mathStdlib.stats.base.dists.f.cdf(
                    x,
                    degreeOfFreedom1,
                    degreeOfFreedom2
                );
            }
            case "fQuantile": {
                if (exprList.length !== 3) {
                    throw new Error(
                        `'fQuantile' expects exactly three arguments, received ${exprList.length}`
                    );
                }
                const [arg1, arg2, arg3] = [
                    this.visit(exprList[0]),
                    this.visit(exprList[1]),
                    this.visit(exprList[2]),
                ];
                if (
                    typeof arg1 !== "number" ||
                    typeof arg2 !== "number" ||
                    typeof arg3 !== "number"
                ) {
                    throw new Error(
                        `'fQuantile' expects to receive three number arguments, received ${typeof arg1}, ${typeof arg2} and ${typeof arg3}`
                    );
                }
                let p = arg1 as number;
                const [v1, v2] = [arg2 as number, arg3 as number];
                if (p < -DEFAULT_EPS || p > 1 + DEFAULT_EPS) {
                    throw new Error(
                        `'fQuantile' expects to receive a number between 0 and 1 as first argument, received ${p}`
                    );
                }
                p = _.clamp(p, 0, 1);
                if (!isInt(v1) || !isInt(v2)) {
                    throw new Error(
                        `'fQuantile' expects to receive two integers as second and third arguments, received ${v1} and ${v2}`
                    );
                }
                const [degreeOfFreedom1, degreeOfFreedom2] = [
                    Math.round(v1),
                    Math.round(v2),
                ];
                if (degreeOfFreedom1 < 1 || degreeOfFreedom2 < 1) {
                    throw new Error(
                        `'fQuantile' expects to receive two positive integers as second and third arguments, received ${degreeOfFreedom1} and ${degreeOfFreedom2}`
                    );
                }
                return mathStdlib.stats.base.dists.f.quantile(
                    p,
                    degreeOfFreedom1,
                    degreeOfFreedom2
                );
            }
            case "binomial": {
                if (exprList.length !== 3) {
                    throw new Error(
                        `'binom' expects exactly three arguments, received ${exprList.length}`
                    );
                }
                const [arg1, arg2, arg3] = [
                    this.visit(exprList[0]),
                    this.visit(exprList[1]),
                    this.visit(exprList[2]),
                ];
                if (
                    typeof arg1 !== "number" ||
                    typeof arg2 !== "number" ||
                    typeof arg3 !== "number"
                ) {
                    throw new Error(
                        `'binom' expects to receive three number arguments, received ${typeof arg1}, ${typeof arg2} and ${typeof arg3}`
                    );
                }
                const [x, n, p] = [
                    arg1 as number,
                    arg2 as number,
                    arg3 as number,
                ];
                if (!isInt(x) || !isInt(n)) {
                    throw new Error(
                        `'binom' expects to receive two integers as first and second arguments, received ${x} and ${n}`
                    );
                }
                const [value, numTrials] = [Math.round(x), Math.round(n)];
                let probSuccess = p;
                if (!(value >= 0 && value <= numTrials)) {
                    throw new Error(
                        `'binomCdf' expects to receive value in range [0, ${numTrials}], received ${value} and ${numTrials}`
                    );
                }
                if (numTrials < 0) {
                    throw new Error(
                        `'binomCdf' expects to receive a positive integer as second argument, received ${numTrials}`
                    );
                }
                if (
                    probSuccess < -DEFAULT_EPS ||
                    probSuccess > 1 + DEFAULT_EPS
                ) {
                    throw new Error(
                        `'binomCdf' expects to receive a number in range [0, 1], received ${probSuccess}`
                    );
                }
                probSuccess = _.clamp(probSuccess, 0, 1);
                return mathStdlib.stats.base.dists.binomial.pmf(
                    value,
                    numTrials,
                    probSuccess
                );
            }
            case "binomialCdf": {
                if (exprList.length !== 3) {
                    throw new Error(
                        `'binomCdf' expects exactly three arguments, received ${exprList.length}`
                    );
                }
                const [arg1, arg2, arg3] = [
                    this.visit(exprList[0]),
                    this.visit(exprList[1]),
                    this.visit(exprList[2]),
                ];
                if (
                    typeof arg1 !== "number" ||
                    typeof arg2 !== "number" ||
                    typeof arg3 !== "number"
                ) {
                    throw new Error(
                        `'binomCdf' expects to receive three number arguments, received ${typeof arg1}, ${typeof arg2} and ${typeof arg3}`
                    );
                }
                const [x, n, p] = [
                    arg1 as number,
                    arg2 as number,
                    arg3 as number,
                ];
                if (!isInt(x) || !isInt(n)) {
                    throw new Error(
                        `'binomCdf' expects to receive an integer as second argument, received ${n}`
                    );
                }
                const [value, numTrials] = [Math.round(x), Math.round(n)];
                let probSuccess = p;
                if (!(value >= 0 && value <= numTrials)) {
                    throw new Error(
                        `'binomCdf' expects to receive value in range [0, ${numTrials}], received ${value} and ${numTrials}`
                    );
                }
                if (numTrials < 0) {
                    throw new Error(
                        `'binomCdf' expects to receive a positive integer as second argument, received ${numTrials}`
                    );
                }
                if (
                    probSuccess < -DEFAULT_EPS ||
                    probSuccess > 1 + DEFAULT_EPS
                ) {
                    throw new Error(
                        `'binomCdf' expects to receive a number in range [0, 1], received ${probSuccess}`
                    );
                }
                probSuccess = _.clamp(probSuccess, 0, 1);
                return mathStdlib.stats.base.dists.binomial.cdf(
                    value,
                    numTrials,
                    probSuccess
                );
            }
            case "poisson": {
                if (exprList.length !== 2) {
                    throw new Error(
                        `'poisson' expects exactly two arguments, received ${exprList.length}`
                    );
                }
                const [arg1, arg2] = [
                    this.visit(exprList[0]),
                    this.visit(exprList[1]),
                ];
                if (typeof arg1 !== "number" || typeof arg2 !== "number") {
                    throw new Error(
                        `'poisson' expects to receive two number arguments, received ${typeof arg1} and ${typeof arg2}`
                    );
                }
                const [x, lambda] = [arg1 as number, arg2 as number];
                if (!isInt(x)) {
                    throw new Error(
                        `'poisson' expects to receive an integer as first argument, received ${x}`
                    );
                }
                const value = Math.round(x);
                if (lambda <= DEFAULT_EPS) {
                    throw new Error(
                        `'poisson' expects to receive a positive number as second argument, received ${lambda}`
                    );
                }
                return mathStdlib.stats.base.dists.poisson.pmf(value, lambda);
            }
            case "poissonCdf": {
                if (exprList.length !== 2) {
                    throw new Error(
                        `'poissonCdf' expects exactly two arguments, received ${exprList.length}`
                    );
                }
                const [arg1, arg2] = [
                    this.visit(exprList[0]),
                    this.visit(exprList[1]),
                ];
                if (typeof arg1 !== "number" || typeof arg2 !== "number") {
                    throw new Error(
                        `'poissonCdf' expects to receive two number arguments, received ${typeof arg1} and ${typeof arg2}`
                    );
                }
                const [x, lambda] = [arg1 as number, arg2 as number];
                if (!isInt(x)) {
                    throw new Error(
                        `'poissonCdf' expects to receive an integer as first argument, received ${x}`
                    );
                }
                const value = Math.round(x);
                if (lambda <= DEFAULT_EPS) {
                    throw new Error(
                        `'poissonCdf' expects to receive a positive number as second argument, received ${lambda}`
                    );
                }
                return mathStdlib.stats.base.dists.poisson.cdf(value, lambda);
            }
            case "exponential": {
                if (exprList.length !== 2) {
                    throw new Error(
                        `'exponential' expects exactly two arguments, received ${exprList.length}`
                    );
                }
                const [arg1, arg2] = [
                    this.visit(exprList[0]),
                    this.visit(exprList[1]),
                ];
                if (typeof arg1 !== "number" || typeof arg2 !== "number") {
                    throw new Error(
                        `'exponential' expects to receive two number arguments, received ${typeof arg1} and ${typeof arg2}`
                    );
                }
                const [x, lambda] = [arg1 as number, arg2 as number];
                if (lambda <= DEFAULT_EPS) {
                    throw new Error(
                        `'exponential' expects to receive a positive number as second argument, received ${lambda}`
                    );
                }
                return mathStdlib.stats.base.dists.exponential.pdf(x, lambda);
            }
            case "exponentialCdf": {
                if (exprList.length !== 2) {
                    throw new Error(
                        `'exponentialCdf' expects exactly two arguments, received ${exprList.length}`
                    );
                }
                const [arg1, arg2] = [
                    this.visit(exprList[0]),
                    this.visit(exprList[1]),
                ];
                if (typeof arg1 !== "number" || typeof arg2 !== "number") {
                    throw new Error(
                        `'exponentialCdf' expects to receive two number arguments, received ${typeof arg1} and ${typeof arg2}`
                    );
                }
                const [x, lambda] = [arg1 as number, arg2 as number];
                if (lambda <= DEFAULT_EPS) {
                    throw new Error(
                        `'exponentialCdf' expects to receive a positive number as second argument, received ${lambda}`
                    );
                }
                return mathStdlib.stats.base.dists.exponential.cdf(x, lambda);
            }
            case "exponentialQuantile": {
                if (exprList.length !== 2) {
                    throw new Error(
                        `'exponentialQuantile' expects exactly two arguments, received ${exprList.length}`
                    );
                }
                const [arg1, arg2] = [
                    this.visit(exprList[0]),
                    this.visit(exprList[1]),
                ];
                if (typeof arg1 !== "number" || typeof arg2 !== "number") {
                    throw new Error(
                        `'exponentialQuantile' expects to receive two number arguments, received ${typeof arg1} and ${typeof arg2}`
                    );
                }
                let p = arg1 as number;
                const lambda = arg2 as number;
                if (lambda <= DEFAULT_EPS) {
                    throw new Error(
                        `'exponentialQuantile' expects to receive a positive number as second argument, received ${lambda}`
                    );
                }
                if (p < -DEFAULT_EPS || p > 1 + DEFAULT_EPS) {
                    throw new Error(
                        `'exponentialQuantile' expects to receive a number between 0 and 1 as first argument, received ${p}`
                    );
                }
                p = _.clamp(p, 0, 1);
                return mathStdlib.stats.base.dists.exponential.quantile(
                    p,
                    lambda
                );
            }
            default: {
                throw new Error(`Unknown function name ${funcName}`);
            }
        }
    };

    visitIfStatement = (ctx: IfStatementContext): QuestionReturnType => {
        const expr = this.visit(ctx.expr());
        if (typeof expr !== "boolean") {
            throw new Error(`if-statement condition must resolve to a boolean`);
        }
        const value = expr as boolean;
        if (value) {
            this.visit(ctx.statement(0));
        } else {
            this.visit(ctx.statement(1));
        }
    };

    public getSymbols(): Map<string, QuestionReturnType> {
        return this.symbols;
    }
}
