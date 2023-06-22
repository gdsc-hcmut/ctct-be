// Generated from Grammar.g4 by ANTLR 4.13.0

import { ParseTreeVisitor } from "antlr4";

import { ProgContext } from "./GrammarParser";
import { StatementContext } from "./GrammarParser";
import { IdentifierContext } from "./GrammarParser";
import { LogicalNotContext } from "./GrammarParser";
import { MultilpyContext } from "./GrammarParser";
import { DisjunctionContext } from "./GrammarParser";
import { AssignmentContext } from "./GrammarParser";
import { NotEqualComparisonContext } from "./GrammarParser";
import { SubtractionContext } from "./GrammarParser";
import { LessComparisonContext } from "./GrammarParser";
import { ParenthesisContext } from "./GrammarParser";
import { DivisionContext } from "./GrammarParser";
import { StringValueContext } from "./GrammarParser";
import { GreaterComparisonContext } from "./GrammarParser";
import { ConjunctionContext } from "./GrammarParser";
import { FunctionCallContext } from "./GrammarParser";
import { NumberValueContext } from "./GrammarParser";
import { IfExpressionContext } from "./GrammarParser";
import { ModuloContext } from "./GrammarParser";
import { EqualComparisonContext } from "./GrammarParser";
import { AdditionContext } from "./GrammarParser";

/**
 * This interface defines a complete generic visitor for a parse tree produced
 * by `GrammarParser`.
 *
 * @param <Result> The return type of the visit operation. Use `void` for
 * operations with no return type.
 */
export default class GrammarVisitor<Result> extends ParseTreeVisitor<Result> {
    /**
     * Visit a parse tree produced by `GrammarParser.prog`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitProg?: (ctx: ProgContext) => Result;
    /**
     * Visit a parse tree produced by `GrammarParser.statement`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitStatement?: (ctx: StatementContext) => Result;
    /**
     * Visit a parse tree produced by the `identifier`
     * labeled alternative in `GrammarParser.expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitIdentifier?: (ctx: IdentifierContext) => Result;
    /**
     * Visit a parse tree produced by the `logicalNot`
     * labeled alternative in `GrammarParser.expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLogicalNot?: (ctx: LogicalNotContext) => Result;
    /**
     * Visit a parse tree produced by the `multilpy`
     * labeled alternative in `GrammarParser.expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitMultilpy?: (ctx: MultilpyContext) => Result;
    /**
     * Visit a parse tree produced by the `disjunction`
     * labeled alternative in `GrammarParser.expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitDisjunction?: (ctx: DisjunctionContext) => Result;
    /**
     * Visit a parse tree produced by the `assignment`
     * labeled alternative in `GrammarParser.expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitAssignment?: (ctx: AssignmentContext) => Result;
    /**
     * Visit a parse tree produced by the `notEqualComparison`
     * labeled alternative in `GrammarParser.expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitNotEqualComparison?: (ctx: NotEqualComparisonContext) => Result;
    /**
     * Visit a parse tree produced by the `subtraction`
     * labeled alternative in `GrammarParser.expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSubtraction?: (ctx: SubtractionContext) => Result;
    /**
     * Visit a parse tree produced by the `lessComparison`
     * labeled alternative in `GrammarParser.expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLessComparison?: (ctx: LessComparisonContext) => Result;
    /**
     * Visit a parse tree produced by the `parenthesis`
     * labeled alternative in `GrammarParser.expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitParenthesis?: (ctx: ParenthesisContext) => Result;
    /**
     * Visit a parse tree produced by the `division`
     * labeled alternative in `GrammarParser.expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitDivision?: (ctx: DivisionContext) => Result;
    /**
     * Visit a parse tree produced by the `stringValue`
     * labeled alternative in `GrammarParser.expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitStringValue?: (ctx: StringValueContext) => Result;
    /**
     * Visit a parse tree produced by the `greaterComparison`
     * labeled alternative in `GrammarParser.expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitGreaterComparison?: (ctx: GreaterComparisonContext) => Result;
    /**
     * Visit a parse tree produced by the `conjunction`
     * labeled alternative in `GrammarParser.expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitConjunction?: (ctx: ConjunctionContext) => Result;
    /**
     * Visit a parse tree produced by the `functionCall`
     * labeled alternative in `GrammarParser.expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFunctionCall?: (ctx: FunctionCallContext) => Result;
    /**
     * Visit a parse tree produced by the `numberValue`
     * labeled alternative in `GrammarParser.expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitNumberValue?: (ctx: NumberValueContext) => Result;
    /**
     * Visit a parse tree produced by the `ifExpression`
     * labeled alternative in `GrammarParser.expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitIfExpression?: (ctx: IfExpressionContext) => Result;
    /**
     * Visit a parse tree produced by the `modulo`
     * labeled alternative in `GrammarParser.expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitModulo?: (ctx: ModuloContext) => Result;
    /**
     * Visit a parse tree produced by the `equalComparison`
     * labeled alternative in `GrammarParser.expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitEqualComparison?: (ctx: EqualComparisonContext) => Result;
    /**
     * Visit a parse tree produced by the `addition`
     * labeled alternative in `GrammarParser.expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitAddition?: (ctx: AdditionContext) => Result;
}
