import {
    AdditionContext,
    AssignmentContext,
    ConjunctionContext,
    DisjunctionContext,
    DivisionContext,
    EqualComparisonContext,
    ExprContext,
    FunctionCallContext,
    GreaterComparisonContext,
    IdentifierContext,
    IfExpressionContext,
    LessComparisonContext,
    LogicalNotContext,
    ModuloContext,
    MultilpyContext,
    NotEqualComparisonContext,
    NumberValueContext,
    ParenthesisContext,
    ProgContext,
    StatementContext,
    StringValueContext,
    SubtractionContext,
} from "./GrammarParser";
import GrammarVisitor from "./GrammarVisitor";

export type QuestionReturnType = number | string | boolean | void;
const DEFAULT_EPS = 1e-9;

export default class QuestionGrammarVisitor extends GrammarVisitor<QuestionReturnType> {
    private symbols: Map<string, QuestionReturnType>;

    constructor() {
        super();
        this.symbols = new Map<string, QuestionReturnType>();
    }

    visitProg = (ctx: ProgContext): QuestionReturnType => {
        const statementsContexts = ctx.statement_list();
        for (const context of statementsContexts) {
            this.visit(context);
        }
        return;
    };

    visitStatement = (ctx: StatementContext): QuestionReturnType => {
        const expr = ctx.expr();
        if (expr != null) {
            this.visit(expr);
        }
    };

    visitIdentifier = (ctx: IdentifierContext): QuestionReturnType => {
        if (!ctx.ID()) {
            throw new Error(
                `Assignment without specifying a name or invalid name`
            );
        }
        const id = ctx.ID().getText();
        if (!this.symbols.has(ctx.ID().getText())) {
            throw new Error(`Symbol '${id} unknown'`);
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

    visitMultilpy = (ctx: MultilpyContext): QuestionReturnType => {
        const exprList = ctx.expr_list();
        if (exprList.length != 2) {
            throw new Error(
                `'*' operator must be associated with exactly 2 expressions`
            );
        }
        const [lhs, rhs] = [this.visit(exprList[0]), this.visit(exprList[1])];
        if (typeof lhs !== typeof rhs) {
            throw new Error(
                `Operands to '*' are of different types (${typeof lhs} and ${typeof rhs})`
            );
        }
        if (typeof lhs !== "number") {
            throw new Error(
                `Operands to '*' must be of type 'number'. Received ${typeof lhs}`
            );
        }
        return (lhs as number) * (rhs as number);
    };

    visitDisjunction = (ctx: DisjunctionContext): QuestionReturnType => {
        const exprList = ctx.expr_list();
        if (exprList.length != 2) {
            throw new Error(
                `'||' operator must be associated with exactly 2 expressions`
            );
        }
        const [lhs, rhs] = [this.visit(exprList[0]), this.visit(exprList[1])];
        if (typeof lhs !== typeof rhs) {
            throw new Error(
                `Operands to '||' are of different types (${typeof lhs} and ${typeof rhs})`
            );
        }
        if (typeof lhs !== "boolean") {
            throw new Error(
                `Operands to '||' must be of type 'boolean'. Received ${typeof lhs}`
            );
        }
        return (lhs as boolean) || (rhs as boolean);
    };

    visitAssignment = (ctx: AssignmentContext): QuestionReturnType => {
        const id = ctx.ID()?.getText();
        if (!id) {
            throw new Error(`Expected identifier name for assignment`);
        }
        if (!ctx.EQUAL()) {
            throw new Error(`Expected '=' for assignment`);
        }
        const exprCtx = ctx.expr();
        if (!exprCtx) {
            throw new Error(
                `Missing expression (right-hand side) in assignment`
            );
        }
        const expr = this.visit(exprCtx);
        if (this.symbols.has(id)) {
            throw new Error(
                `Variables are immutable. '${id}' already has a value (${this.symbols.get(
                    id
                )})`
            );
        }
        this.symbols.set(id, expr);
        return expr;
    };

    visitNotEqualComparison = (
        ctx: NotEqualComparisonContext
    ): QuestionReturnType => {
        if (!ctx.EXCLAM()) {
            throw new Error(`Mising '!' for not equal comparison`);
        }
        if (!ctx.EQUAL()) {
            throw new Error(`Mising '=' for not equal comparison`);
        }
        const exprList = ctx.expr_list();
        const [lhs, rhs] = [this.visit(exprList[0]), this.visit(exprList[1])];
        if (!lhs) {
            throw new Error(`Missing left-hand side for not equal comparison`);
        }
        if (!rhs) {
            throw new Error(`Missing right-hand side for not equal comparison`);
        }
        if (typeof lhs !== typeof rhs) {
            throw new Error(
                `Not equal comparison between two different types, '${typeof lhs}' and '${typeof rhs}'`
            );
        }
        return typeof lhs === "number"
            ? Math.abs((lhs as number) - (rhs as number)) > DEFAULT_EPS
            : lhs !== rhs;
    };

    visitSubtraction = (ctx: SubtractionContext): QuestionReturnType => {
        const exprList = ctx.expr_list();
        const [lhs, rhs] = [this.visit(exprList[0]), this.visit(exprList[1])];
        if (!lhs) {
            throw new Error(`Missing left-hand side for subtraction`);
        }
        if (!rhs) {
            throw new Error(`Missing right-hand side for subtraction`);
        }
        if (typeof lhs !== typeof rhs) {
            throw new Error(
                `'-' between two different types, '${typeof lhs}' and '${typeof rhs}'`
            );
        }
        if (typeof lhs !== "number") {
            throw new Error(
                `'-' can only be used with two numbers. Received ${typeof lhs}`
            );
        }
        return (lhs as number) - (rhs as number);
    };

    visitLessComparison = (ctx: LessComparisonContext): QuestionReturnType => {
        const exprList = ctx.expr_list();
        const [lhs, rhs] = [this.visit(exprList[0]), this.visit(exprList[1])];
        if (!lhs) {
            throw new Error(
                `Missing left-hand side for less-than (or less-than-equal) comparison`
            );
        }
        if (!rhs) {
            throw new Error(
                `Missing right-hand side for less-than (or less-than-equal) comparison`
            );
        }
        if (typeof lhs !== typeof rhs) {
            throw new Error(
                `less-than (or less-than-equal) between two different types, '${typeof lhs}' and '${typeof rhs}'`
            );
        }
        if (typeof lhs === "boolean") {
            throw new Error(
                `less-than (or less-than-equal) cannot be used with type ${typeof lhs}`
            );
        }
        if (ctx.EQUAL()) {
            return typeof lhs === "number"
                ? (lhs as number) - (rhs as number) <= DEFAULT_EPS
                : lhs <= rhs;
        } else {
            return typeof lhs === "number"
                ? (lhs as number) - (rhs as number) < -DEFAULT_EPS
                : lhs < rhs;
        }
    };

    visitParenthesis = (ctx: ParenthesisContext): QuestionReturnType => {
        if (!ctx.LPAREN) {
            throw new Error("Expected '('");
        }
        if (!ctx.RPAREN) {
            throw new Error("Expected ')'");
        }
        if (!ctx.expr()) {
            throw new Error(`Missing expression in parentheses`);
        }
        return this.visit(ctx.expr());
    };

    visitDivision = (ctx: DivisionContext): QuestionReturnType => {
        const exprList = ctx.expr_list();
        if (exprList.length != 2) {
            throw new Error(
                `'/' operator must be associated with exactly 2 expressions`
            );
        }
        const [lhs, rhs] = [this.visit(exprList[0]), this.visit(exprList[1])];
        if (typeof lhs !== typeof rhs) {
            throw new Error(
                `Operands to '/' are of different types (${typeof lhs} and ${typeof rhs})`
            );
        }
        if (typeof lhs !== "number") {
            throw new Error(
                `Operands to '/' must be of type 'number'. Received ${typeof lhs}`
            );
        }
        if (Math.abs(rhs as number) <= DEFAULT_EPS) {
            throw new Error(`Right-hand side of division is zero`);
        }
        return (lhs as number) / (rhs as number);
    };

    visitStringValue = (ctx: StringValueContext): QuestionReturnType => {
        return ctx.STRING().getText().slice(1, -1); // remove first and last character
    };

    visitGreaterComparison = (
        ctx: GreaterComparisonContext
    ): QuestionReturnType => {
        const exprList = ctx.expr_list();
        const [lhs, rhs] = [this.visit(exprList[0]), this.visit(exprList[1])];
        if (!lhs) {
            throw new Error(
                `Missing left-hand side for greater-than (greater-than-equal) comparison`
            );
        }
        if (!rhs) {
            throw new Error(
                `Missing right-hand side for greater-than (greater-than-equal) comparison`
            );
        }
        if (typeof lhs !== typeof rhs) {
            throw new Error(
                `greater-than (greater-than-equal) between two different types, '${typeof lhs}' and '${typeof rhs}'`
            );
        }
        if (typeof lhs === "boolean") {
            throw new Error(
                `greater-than (greater-than-equal) cannot be used with type ${typeof lhs}`
            );
        }
        if (ctx.EQUAL()) {
            return typeof lhs === "number"
                ? (lhs as number) - (rhs as number) >= -DEFAULT_EPS
                : lhs >= rhs;
        } else {
            return typeof lhs === "number"
                ? (lhs as number) - (rhs as number) > DEFAULT_EPS
                : lhs > rhs;
        }
    };

    visitConjunction = (ctx: ConjunctionContext): QuestionReturnType => {
        const exprList = ctx.expr_list();
        if (exprList.length != 2) {
            throw new Error(
                `'&&' operator must be associated with exactly 2 expressions`
            );
        }
        const [lhs, rhs] = [this.visit(exprList[0]), this.visit(exprList[1])];
        if (typeof lhs !== typeof rhs) {
            throw new Error(
                `Operands to '&&' are of different types (${typeof lhs} and ${typeof rhs})`
            );
        }
        if (typeof lhs !== "boolean") {
            throw new Error(
                `Operands to '&&' must be of type 'boolean'. Received ${typeof lhs}`
            );
        }
        return (lhs as boolean) && (rhs as boolean);
    };

    visitFunctionCall = (ctx: FunctionCallContext): QuestionReturnType => {
        if (!ctx.ID()) {
            throw new Error(`Expected function name`);
        }
        if (!ctx.LPAREN()) {
            throw new Error(`Expected '(' for function call`);
        }
        if (!ctx.RPAREN()) {
            throw new Error(`Expected ')' for function call`);
        }
        const funcName = ctx.ID().getText();
        const exprList = ctx.expr_list();
        switch (funcName) {
            case "bool": {
                if (exprList.length !== 1) {
                    throw new Error(
                        `'bool' expects exactly one argument, received ${exprList.length}`
                    );
                }
                if (typeof exprList[0] === "boolean") return exprList[0];
                else if (typeof exprList[0] === "number")
                    return Math.abs(exprList[0] as number) <= DEFAULT_EPS;
                else if (typeof exprList[0] === "string")
                    throw new Error(
                        `Conversion from 'string' to 'bool' is not allowed`
                    );
                else
                    throw new Error(
                        `Unknown type ${typeof exprList[0]} used in function 'bool'`
                    );
            }
            case "number": {
                if (exprList.length !== 1) {
                    throw new Error(
                        `'number' expects exactly one argument, received ${exprList.length}`
                    );
                }
                if (typeof exprList[0] === "boolean")
                    return (exprList[0] as boolean) ? 1 : 0;
                else if (typeof exprList[0] === "number") return exprList[0];
                else if (typeof exprList[0] === "string")
                    return parseFloat(exprList[0]);
                else
                    throw new Error(
                        `Unknown type ${typeof exprList[0]} used in function 'number'`
                    );
            }
            case "string": {
                if (exprList.length !== 1) {
                    throw new Error(
                        `'string' expects exactly one argument, received ${exprList.length}`
                    );
                }
                if (typeof exprList[0] === "boolean")
                    return (exprList[0] as boolean) ? "true" : "false";
                else if (typeof exprList[0] === "number")
                    return (exprList[0] as number).toString();
                else if (typeof exprList[0] === "string") return exprList[0];
                else
                    throw new Error(
                        `Unknown type ${typeof exprList[0]} used in function 'string'`
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
                return Math.floor(Math.random() * (t - f + 1) + f);
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
                return (
                    Math.random() * ((to as number) - (from as number)) +
                    (from as number)
                );
            }
            case "nonzerorand": {
                throw new Error(`Not implemented yet :P`);
            }
            case "nonzerorrand": {
                throw new Error(`Not implemented yet :P`);
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
                const num = x as number;
                if (num < -1 || num > 1) {
                    throw new Error(
                        `Argument to 'arcsin' should be in range [-1, 1] (received ${num})`
                    );
                }
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
                const num = x as number;
                if (num < -1 || num > 1) {
                    throw new Error(
                        `Argument to 'arccos' should be in range [-1, 1] (received ${num})`
                    );
                }
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
            default: {
                throw new Error(`Unknown function name ${funcName}`);
            }
        }
    };

    visitNumberValue = (ctx: NumberValueContext): QuestionReturnType => {
        return parseFloat(ctx.NUM().getText());
    };

    visitIfExpression = (ctx: IfExpressionContext): QuestionReturnType => {
        const exprList = ctx.expr_list();
        if (exprList.length !== 3) {
            throw new Error(
                `if-statement must be associated with 3 expressions`
            );
        }
        const [cond, exprIf, exprElse] = [
            this.visit(exprList[0]),
            this.visit(exprList[1]),
            this.visit(exprList[2]),
        ];
        if (typeof cond != "boolean") {
            throw new Error(
                `condition of if-statement does not resolve to a boolean`
            );
        }
        return (cond as boolean) ? exprIf : exprElse;
    };

    visitModulo = (ctx: ModuloContext): QuestionReturnType => {
        const exprList = ctx.expr_list();
        if (exprList.length !== 2) {
            throw new Error(
                `'%' can only be associated with exactly 2 operands`
            );
        }
        const [lhs, rhs] = [this.visit(exprList[0]), this.visit(exprList[1])];
        if (typeof lhs !== typeof rhs) {
            throw new Error(
                `Operands to '%' are of different types (${typeof lhs} and ${typeof rhs})`
            );
        }
        if (typeof lhs !== "number") {
            throw new Error(
                `Operands to '%' must be of type 'number'. Received ${typeof lhs}`
            );
        }
        return (lhs as number) % (rhs as number);
    };

    visitEqualComparison = (
        ctx: EqualComparisonContext
    ): QuestionReturnType => {
        const exprList = ctx.expr_list();
        const [lhs, rhs] = [this.visit(exprList[0]), this.visit(exprList[1])];
        if (!lhs) {
            throw new Error(`Missing left-hand side for equal comparison`);
        }
        if (!rhs) {
            throw new Error(`Missing right-hand side for equal comparison`);
        }
        if (typeof lhs !== typeof rhs) {
            throw new Error(
                `Equal comparison between two different types, '${typeof lhs}' and '${typeof rhs}'`
            );
        }
        return typeof lhs === "number"
            ? Math.abs((lhs as number) - (rhs as number)) <= DEFAULT_EPS
            : lhs === rhs;
    };

    visitAddition = (ctx: AdditionContext): QuestionReturnType => {
        const exprList = ctx.expr_list();
        const [lhs, rhs] = [this.visit(exprList[0]), this.visit(exprList[1])];
        if (!lhs) {
            throw new Error(`Missing left-hand side for addition`);
        }
        if (!rhs) {
            throw new Error(`Missing right-hand side for addition`);
        }
        if (typeof lhs !== typeof rhs) {
            throw new Error(
                `'+' between two different types, '${typeof lhs}' and '${typeof rhs}'`
            );
        }
        if (typeof lhs !== "number") {
            throw new Error(
                `'+' can only be used with two numbers. Received ${typeof lhs}`
            );
        }
        return (lhs as number) + (rhs as number);
    };

    public getSymbols(): Map<string, QuestionReturnType> {
        return this.symbols;
    }
}
