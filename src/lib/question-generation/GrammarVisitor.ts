// Generated from Grammar.g4 by ANTLR 4.13.0

import { ParseTreeVisitor } from "antlr4";

import { ProgContext } from "./GrammarParser";
import { StatementContext } from "./GrammarParser";
import { AssignmentStatementContext } from "./GrammarParser";
import { IfStatementContext } from "./GrammarParser";
import { BlockStatementContext } from "./GrammarParser";
import { IdentifierContext } from "./GrammarParser";
import { LogicalNotContext } from "./GrammarParser";
import { MultiplyDivideModuloContext } from "./GrammarParser";
import { ConjunctionContext } from "./GrammarParser";
import { AddSubtractContext } from "./GrammarParser";
import { DisjunctionContext } from "./GrammarParser";
import { FunctionCallContext } from "./GrammarParser";
import { NonEqualityComparisonContext } from "./GrammarParser";
import { UnaryPlusMinusContext } from "./GrammarParser";
import { EqualityComparisonContext } from "./GrammarParser";
import { ParenthesisContext } from "./GrammarParser";
import { LiteralContext } from "./GrammarParser";

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
     * Visit a parse tree produced by `GrammarParser.assignmentStatement`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitAssignmentStatement?: (ctx: AssignmentStatementContext) => Result;
    /**
     * Visit a parse tree produced by `GrammarParser.ifStatement`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitIfStatement?: (ctx: IfStatementContext) => Result;
    /**
     * Visit a parse tree produced by `GrammarParser.blockStatement`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitBlockStatement?: (ctx: BlockStatementContext) => Result;
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
     * Visit a parse tree produced by the `multiplyDivideModulo`
     * labeled alternative in `GrammarParser.expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitMultiplyDivideModulo?: (ctx: MultiplyDivideModuloContext) => Result;
    /**
     * Visit a parse tree produced by the `conjunction`
     * labeled alternative in `GrammarParser.expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitConjunction?: (ctx: ConjunctionContext) => Result;
    /**
     * Visit a parse tree produced by the `addSubtract`
     * labeled alternative in `GrammarParser.expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitAddSubtract?: (ctx: AddSubtractContext) => Result;
    /**
     * Visit a parse tree produced by the `disjunction`
     * labeled alternative in `GrammarParser.expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitDisjunction?: (ctx: DisjunctionContext) => Result;
    /**
     * Visit a parse tree produced by the `functionCall`
     * labeled alternative in `GrammarParser.expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFunctionCall?: (ctx: FunctionCallContext) => Result;
    /**
     * Visit a parse tree produced by the `nonEqualityComparison`
     * labeled alternative in `GrammarParser.expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitNonEqualityComparison?: (ctx: NonEqualityComparisonContext) => Result;
    /**
     * Visit a parse tree produced by the `unaryPlusMinus`
     * labeled alternative in `GrammarParser.expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitUnaryPlusMinus?: (ctx: UnaryPlusMinusContext) => Result;
    /**
     * Visit a parse tree produced by the `equalityComparison`
     * labeled alternative in `GrammarParser.expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitEqualityComparison?: (ctx: EqualityComparisonContext) => Result;
    /**
     * Visit a parse tree produced by the `parenthesis`
     * labeled alternative in `GrammarParser.expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitParenthesis?: (ctx: ParenthesisContext) => Result;
    /**
     * Visit a parse tree produced by the `literal`
     * labeled alternative in `GrammarParser.expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLiteral?: (ctx: LiteralContext) => Result;
}
