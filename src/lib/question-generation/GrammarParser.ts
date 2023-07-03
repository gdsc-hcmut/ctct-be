// Generated from Grammar.g4 by ANTLR 4.13.0
// noinspection ES6UnusedImports,JSUnusedGlobalSymbols,JSUnusedLocalSymbols

import {
    ATN,
    ATNDeserializer,
    DecisionState,
    DFA,
    FailedPredicateException,
    RecognitionException,
    NoViableAltException,
    BailErrorStrategy,
    Parser,
    ParserATNSimulator,
    RuleContext,
    ParserRuleContext,
    PredictionMode,
    PredictionContextCache,
    TerminalNode,
    RuleNode,
    Token,
    TokenStream,
    Interval,
    IntervalSet,
} from "antlr4";
import GrammarVisitor from "./GrammarVisitor.js";

// for running tests with parameters, TODO: discuss strategy for typed parameters in CI
// eslint-disable-next-line no-unused-vars
type int = number;

export default class GrammarParser extends Parser {
    public static readonly T__0 = 1;
    public static readonly T__1 = 2;
    public static readonly T__2 = 3;
    public static readonly T__3 = 4;
    public static readonly T__4 = 5;
    public static readonly T__5 = 6;
    public static readonly T__6 = 7;
    public static readonly T__7 = 8;
    public static readonly ID = 9;
    public static readonly WS = 10;
    public static readonly NUM = 11;
    public static readonly COMMA = 12;
    public static readonly LPAREN = 13;
    public static readonly RPAREN = 14;
    public static readonly EQUAL = 15;
    public static readonly GREATER = 16;
    public static readonly LESS = 17;
    public static readonly AMPERSAND = 18;
    public static readonly PIPE = 19;
    public static readonly STRING = 20;
    public static readonly EXCLAM = 21;
    public static readonly NL = 22;
    public static readonly EOF = Token.EOF;
    public static readonly RULE_prog = 0;
    public static readonly RULE_statement = 1;
    public static readonly RULE_expr = 2;
    public static readonly literalNames: (string | null)[] = [
        null,
        "'*'",
        "'/'",
        "'%'",
        "'+'",
        "'-'",
        "'if'",
        "'then'",
        "'else'",
        null,
        null,
        null,
        "','",
        "'('",
        "')'",
        "'='",
        "'>'",
        "'<'",
        "'&'",
        "'|'",
        null,
        "'!'",
        "'\\n'",
    ];
    public static readonly symbolicNames: (string | null)[] = [
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        "ID",
        "WS",
        "NUM",
        "COMMA",
        "LPAREN",
        "RPAREN",
        "EQUAL",
        "GREATER",
        "LESS",
        "AMPERSAND",
        "PIPE",
        "STRING",
        "EXCLAM",
        "NL",
    ];
    // tslint:disable:no-trailing-whitespace
    public static readonly ruleNames: string[] = ["prog", "statement", "expr"];
    public get grammarFileName(): string {
        return "Grammar.g4";
    }
    public get literalNames(): (string | null)[] {
        return GrammarParser.literalNames;
    }
    public get symbolicNames(): (string | null)[] {
        return GrammarParser.symbolicNames;
    }
    public get ruleNames(): string[] {
        return GrammarParser.ruleNames;
    }
    public get serializedATN(): number[] {
        return GrammarParser._serializedATN;
    }

    protected createFailedPredicateException(
        predicate?: string,
        message?: string
    ): FailedPredicateException {
        return new FailedPredicateException(this, predicate, message);
    }

    constructor(input: TokenStream) {
        super(input);
        this._interp = new ParserATNSimulator(
            this,
            GrammarParser._ATN,
            GrammarParser.DecisionsToDFA,
            new PredictionContextCache()
        );
    }
    // @RuleVersion(0)
    public prog(): ProgContext {
        const localctx: ProgContext = new ProgContext(
            this,
            this._ctx,
            this.state
        );
        this.enterRule(localctx, 0, GrammarParser.RULE_prog);
        let _la: number;
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 7;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                do {
                    {
                        {
                            this.state = 6;
                            this.statement();
                        }
                    }
                    this.state = 9;
                    this._errHandler.sync(this);
                    _la = this._input.LA(1);
                } while ((_la & ~0x1f) === 0 && ((1 << _la) & 3156544) !== 0);
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }
    // @RuleVersion(0)
    public statement(): StatementContext {
        const localctx: StatementContext = new StatementContext(
            this,
            this._ctx,
            this.state
        );
        this.enterRule(localctx, 2, GrammarParser.RULE_statement);
        let _la: number;
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 11;
                this.expr(0);
                this.state = 15;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                while (_la === 22) {
                    {
                        {
                            this.state = 12;
                            this.match(GrammarParser.NL);
                        }
                    }
                    this.state = 17;
                    this._errHandler.sync(this);
                    _la = this._input.LA(1);
                }
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return localctx;
    }

    public expr(): ExprContext;
    public expr(_p: number): ExprContext;
    // @RuleVersion(0)
    public expr(_p?: number): ExprContext {
        if (_p === undefined) {
            _p = 0;
        }

        const _parentctx: ParserRuleContext = this._ctx;
        const _parentState: number = this.state;
        let localctx: ExprContext = new ExprContext(
            this,
            this._ctx,
            _parentState
        );
        let _prevctx: ExprContext = localctx;
        const _startState = 4;
        this.enterRecursionRule(localctx, 4, GrammarParser.RULE_expr, _p);
        let _la: number;
        try {
            let _alt: number;
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 51;
                this._errHandler.sync(this);
                switch (
                    this._interp.adaptivePredict(this._input, 4, this._ctx)
                ) {
                    case 1:
                        {
                            localctx = new ParenthesisContext(this, localctx);
                            this._ctx = localctx;
                            _prevctx = localctx;

                            this.state = 19;
                            this.match(GrammarParser.LPAREN);
                            this.state = 20;
                            this.expr(0);
                            this.state = 21;
                            this.match(GrammarParser.RPAREN);
                        }
                        break;
                    case 2:
                        {
                            localctx = new LogicalNotContext(this, localctx);
                            this._ctx = localctx;
                            _prevctx = localctx;
                            this.state = 23;
                            this.match(GrammarParser.EXCLAM);
                            this.state = 24;
                            this.expr(18);
                        }
                        break;
                    case 3:
                        {
                            localctx = new AssignmentContext(this, localctx);
                            this._ctx = localctx;
                            _prevctx = localctx;
                            this.state = 25;
                            this.match(GrammarParser.ID);
                            this.state = 26;
                            this.match(GrammarParser.EQUAL);
                            this.state = 27;
                            this.expr(6);
                        }
                        break;
                    case 4:
                        {
                            localctx = new IfExpressionContext(this, localctx);
                            this._ctx = localctx;
                            _prevctx = localctx;
                            this.state = 28;
                            this.match(GrammarParser.T__5);
                            this.state = 29;
                            this.expr(0);
                            this.state = 30;
                            this.match(GrammarParser.T__6);
                            this.state = 31;
                            this.expr(0);
                            this.state = 32;
                            this.match(GrammarParser.T__7);
                            this.state = 33;
                            this.expr(5);
                        }
                        break;
                    case 5:
                        {
                            localctx = new FunctionCallContext(this, localctx);
                            this._ctx = localctx;
                            _prevctx = localctx;
                            this.state = 35;
                            this.match(GrammarParser.ID);
                            this.state = 36;
                            this.match(GrammarParser.LPAREN);
                            this.state = 45;
                            this._errHandler.sync(this);
                            _la = this._input.LA(1);
                            if (
                                (_la & ~0x1f) === 0 &&
                                ((1 << _la) & 3156544) !== 0
                            ) {
                                {
                                    this.state = 37;
                                    this.expr(0);
                                    this.state = 42;
                                    this._errHandler.sync(this);
                                    _la = this._input.LA(1);
                                    while (_la === 12) {
                                        {
                                            {
                                                this.state = 38;
                                                this.match(GrammarParser.COMMA);
                                                this.state = 39;
                                                this.expr(0);
                                            }
                                        }
                                        this.state = 44;
                                        this._errHandler.sync(this);
                                        _la = this._input.LA(1);
                                    }
                                }
                            }

                            this.state = 47;
                            this.match(GrammarParser.RPAREN);
                        }
                        break;
                    case 6:
                        {
                            localctx = new StringValueContext(this, localctx);
                            this._ctx = localctx;
                            _prevctx = localctx;
                            this.state = 48;
                            this.match(GrammarParser.STRING);
                        }
                        break;
                    case 7:
                        {
                            localctx = new IdentifierContext(this, localctx);
                            this._ctx = localctx;
                            _prevctx = localctx;
                            this.state = 49;
                            this.match(GrammarParser.ID);
                        }
                        break;
                    case 8:
                        {
                            localctx = new NumberValueContext(this, localctx);
                            this._ctx = localctx;
                            _prevctx = localctx;
                            this.state = 50;
                            this.match(GrammarParser.NUM);
                        }
                        break;
                }
                this._ctx.stop = this._input.LT(-1);
                this.state = 98;
                this._errHandler.sync(this);
                _alt = this._interp.adaptivePredict(this._input, 8, this._ctx);
                while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
                    if (_alt === 1) {
                        if (this._parseListeners != null) {
                            this.triggerExitRuleEvent();
                        }
                        _prevctx = localctx;
                        {
                            this.state = 96;
                            this._errHandler.sync(this);
                            switch (
                                this._interp.adaptivePredict(
                                    this._input,
                                    7,
                                    this._ctx
                                )
                            ) {
                                case 1:
                                    {
                                        localctx = new MultilpyContext(
                                            this,
                                            new ExprContext(
                                                this,
                                                _parentctx,
                                                _parentState
                                            )
                                        );
                                        this.pushNewRecursionContext(
                                            localctx,
                                            _startState,
                                            GrammarParser.RULE_expr
                                        );
                                        this.state = 53;
                                        if (!this.precpred(this._ctx, 17)) {
                                            throw this.createFailedPredicateException(
                                                "this.precpred(this._ctx, 17)"
                                            );
                                        }
                                        this.state = 54;
                                        this.match(GrammarParser.T__0);
                                        this.state = 55;
                                        this.expr(18);
                                    }
                                    break;
                                case 2:
                                    {
                                        localctx = new DivisionContext(
                                            this,
                                            new ExprContext(
                                                this,
                                                _parentctx,
                                                _parentState
                                            )
                                        );
                                        this.pushNewRecursionContext(
                                            localctx,
                                            _startState,
                                            GrammarParser.RULE_expr
                                        );
                                        this.state = 56;
                                        if (!this.precpred(this._ctx, 16)) {
                                            throw this.createFailedPredicateException(
                                                "this.precpred(this._ctx, 16)"
                                            );
                                        }
                                        this.state = 57;
                                        this.match(GrammarParser.T__1);
                                        this.state = 58;
                                        this.expr(17);
                                    }
                                    break;
                                case 3:
                                    {
                                        localctx = new ModuloContext(
                                            this,
                                            new ExprContext(
                                                this,
                                                _parentctx,
                                                _parentState
                                            )
                                        );
                                        this.pushNewRecursionContext(
                                            localctx,
                                            _startState,
                                            GrammarParser.RULE_expr
                                        );
                                        this.state = 59;
                                        if (!this.precpred(this._ctx, 15)) {
                                            throw this.createFailedPredicateException(
                                                "this.precpred(this._ctx, 15)"
                                            );
                                        }
                                        this.state = 60;
                                        this.match(GrammarParser.T__2);
                                        this.state = 61;
                                        this.expr(16);
                                    }
                                    break;
                                case 4:
                                    {
                                        localctx = new AdditionContext(
                                            this,
                                            new ExprContext(
                                                this,
                                                _parentctx,
                                                _parentState
                                            )
                                        );
                                        this.pushNewRecursionContext(
                                            localctx,
                                            _startState,
                                            GrammarParser.RULE_expr
                                        );
                                        this.state = 62;
                                        if (!this.precpred(this._ctx, 14)) {
                                            throw this.createFailedPredicateException(
                                                "this.precpred(this._ctx, 14)"
                                            );
                                        }
                                        this.state = 63;
                                        this.match(GrammarParser.T__3);
                                        this.state = 64;
                                        this.expr(15);
                                    }
                                    break;
                                case 5:
                                    {
                                        localctx = new SubtractionContext(
                                            this,
                                            new ExprContext(
                                                this,
                                                _parentctx,
                                                _parentState
                                            )
                                        );
                                        this.pushNewRecursionContext(
                                            localctx,
                                            _startState,
                                            GrammarParser.RULE_expr
                                        );
                                        this.state = 65;
                                        if (!this.precpred(this._ctx, 13)) {
                                            throw this.createFailedPredicateException(
                                                "this.precpred(this._ctx, 13)"
                                            );
                                        }
                                        this.state = 66;
                                        this.match(GrammarParser.T__4);
                                        this.state = 67;
                                        this.expr(14);
                                    }
                                    break;
                                case 6:
                                    {
                                        localctx = new EqualComparisonContext(
                                            this,
                                            new ExprContext(
                                                this,
                                                _parentctx,
                                                _parentState
                                            )
                                        );
                                        this.pushNewRecursionContext(
                                            localctx,
                                            _startState,
                                            GrammarParser.RULE_expr
                                        );
                                        this.state = 68;
                                        if (!this.precpred(this._ctx, 12)) {
                                            throw this.createFailedPredicateException(
                                                "this.precpred(this._ctx, 12)"
                                            );
                                        }
                                        this.state = 69;
                                        this.match(GrammarParser.EQUAL);
                                        this.state = 70;
                                        this.match(GrammarParser.EQUAL);
                                        this.state = 71;
                                        this.expr(13);
                                    }
                                    break;
                                case 7:
                                    {
                                        localctx =
                                            new NotEqualComparisonContext(
                                                this,
                                                new ExprContext(
                                                    this,
                                                    _parentctx,
                                                    _parentState
                                                )
                                            );
                                        this.pushNewRecursionContext(
                                            localctx,
                                            _startState,
                                            GrammarParser.RULE_expr
                                        );
                                        this.state = 72;
                                        if (!this.precpred(this._ctx, 11)) {
                                            throw this.createFailedPredicateException(
                                                "this.precpred(this._ctx, 11)"
                                            );
                                        }
                                        this.state = 73;
                                        this.match(GrammarParser.EXCLAM);
                                        this.state = 74;
                                        this.match(GrammarParser.EQUAL);
                                        this.state = 75;
                                        this.expr(12);
                                    }
                                    break;
                                case 8:
                                    {
                                        localctx = new GreaterComparisonContext(
                                            this,
                                            new ExprContext(
                                                this,
                                                _parentctx,
                                                _parentState
                                            )
                                        );
                                        this.pushNewRecursionContext(
                                            localctx,
                                            _startState,
                                            GrammarParser.RULE_expr
                                        );
                                        this.state = 76;
                                        if (!this.precpred(this._ctx, 10)) {
                                            throw this.createFailedPredicateException(
                                                "this.precpred(this._ctx, 10)"
                                            );
                                        }
                                        this.state = 77;
                                        this.match(GrammarParser.GREATER);
                                        this.state = 79;
                                        this._errHandler.sync(this);
                                        _la = this._input.LA(1);
                                        if (_la === 15) {
                                            {
                                                this.state = 78;
                                                this.match(GrammarParser.EQUAL);
                                            }
                                        }

                                        this.state = 81;
                                        this.expr(11);
                                    }
                                    break;
                                case 9:
                                    {
                                        localctx = new LessComparisonContext(
                                            this,
                                            new ExprContext(
                                                this,
                                                _parentctx,
                                                _parentState
                                            )
                                        );
                                        this.pushNewRecursionContext(
                                            localctx,
                                            _startState,
                                            GrammarParser.RULE_expr
                                        );
                                        this.state = 82;
                                        if (!this.precpred(this._ctx, 9)) {
                                            throw this.createFailedPredicateException(
                                                "this.precpred(this._ctx, 9)"
                                            );
                                        }
                                        this.state = 83;
                                        this.match(GrammarParser.LESS);
                                        this.state = 85;
                                        this._errHandler.sync(this);
                                        _la = this._input.LA(1);
                                        if (_la === 15) {
                                            {
                                                this.state = 84;
                                                this.match(GrammarParser.EQUAL);
                                            }
                                        }

                                        this.state = 87;
                                        this.expr(10);
                                    }
                                    break;
                                case 10:
                                    {
                                        localctx = new ConjunctionContext(
                                            this,
                                            new ExprContext(
                                                this,
                                                _parentctx,
                                                _parentState
                                            )
                                        );
                                        this.pushNewRecursionContext(
                                            localctx,
                                            _startState,
                                            GrammarParser.RULE_expr
                                        );
                                        this.state = 88;
                                        if (!this.precpred(this._ctx, 8)) {
                                            throw this.createFailedPredicateException(
                                                "this.precpred(this._ctx, 8)"
                                            );
                                        }
                                        this.state = 89;
                                        this.match(GrammarParser.AMPERSAND);
                                        this.state = 90;
                                        this.match(GrammarParser.AMPERSAND);
                                        this.state = 91;
                                        this.expr(9);
                                    }
                                    break;
                                case 11:
                                    {
                                        localctx = new DisjunctionContext(
                                            this,
                                            new ExprContext(
                                                this,
                                                _parentctx,
                                                _parentState
                                            )
                                        );
                                        this.pushNewRecursionContext(
                                            localctx,
                                            _startState,
                                            GrammarParser.RULE_expr
                                        );
                                        this.state = 92;
                                        if (!this.precpred(this._ctx, 7)) {
                                            throw this.createFailedPredicateException(
                                                "this.precpred(this._ctx, 7)"
                                            );
                                        }
                                        this.state = 93;
                                        this.match(GrammarParser.PIPE);
                                        this.state = 94;
                                        this.match(GrammarParser.PIPE);
                                        this.state = 95;
                                        this.expr(8);
                                    }
                                    break;
                            }
                        }
                    }
                    this.state = 100;
                    this._errHandler.sync(this);
                    _alt = this._interp.adaptivePredict(
                        this._input,
                        8,
                        this._ctx
                    );
                }
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.unrollRecursionContexts(_parentctx);
        }
        return localctx;
    }

    public sempred(
        localctx: RuleContext,
        ruleIndex: number,
        predIndex: number
    ): boolean {
        switch (ruleIndex) {
            case 2:
                return this.expr_sempred(localctx as ExprContext, predIndex);
        }
        return true;
    }
    private expr_sempred(localctx: ExprContext, predIndex: number): boolean {
        switch (predIndex) {
            case 0:
                return this.precpred(this._ctx, 17);
            case 1:
                return this.precpred(this._ctx, 16);
            case 2:
                return this.precpred(this._ctx, 15);
            case 3:
                return this.precpred(this._ctx, 14);
            case 4:
                return this.precpred(this._ctx, 13);
            case 5:
                return this.precpred(this._ctx, 12);
            case 6:
                return this.precpred(this._ctx, 11);
            case 7:
                return this.precpred(this._ctx, 10);
            case 8:
                return this.precpred(this._ctx, 9);
            case 9:
                return this.precpred(this._ctx, 8);
            case 10:
                return this.precpred(this._ctx, 7);
        }
        return true;
    }

    public static readonly _serializedATN: number[] = [
        4, 1, 22, 102, 2, 0, 7, 0, 2, 1, 7, 1, 2, 2, 7, 2, 1, 0, 4, 0, 8, 8, 0,
        11, 0, 12, 0, 9, 1, 1, 1, 1, 5, 1, 14, 8, 1, 10, 1, 12, 1, 17, 9, 1, 1,
        2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1,
        2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 5, 2, 41, 8, 2,
        10, 2, 12, 2, 44, 9, 2, 3, 2, 46, 8, 2, 1, 2, 1, 2, 1, 2, 1, 2, 3, 2,
        52, 8, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1,
        2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1,
        2, 1, 2, 1, 2, 1, 2, 3, 2, 80, 8, 2, 1, 2, 1, 2, 1, 2, 1, 2, 3, 2, 86,
        8, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 5, 2, 97, 8,
        2, 10, 2, 12, 2, 100, 9, 2, 1, 2, 0, 1, 4, 3, 0, 2, 4, 0, 0, 122, 0, 7,
        1, 0, 0, 0, 2, 11, 1, 0, 0, 0, 4, 51, 1, 0, 0, 0, 6, 8, 3, 2, 1, 0, 7,
        6, 1, 0, 0, 0, 8, 9, 1, 0, 0, 0, 9, 7, 1, 0, 0, 0, 9, 10, 1, 0, 0, 0,
        10, 1, 1, 0, 0, 0, 11, 15, 3, 4, 2, 0, 12, 14, 5, 22, 0, 0, 13, 12, 1,
        0, 0, 0, 14, 17, 1, 0, 0, 0, 15, 13, 1, 0, 0, 0, 15, 16, 1, 0, 0, 0, 16,
        3, 1, 0, 0, 0, 17, 15, 1, 0, 0, 0, 18, 19, 6, 2, -1, 0, 19, 20, 5, 13,
        0, 0, 20, 21, 3, 4, 2, 0, 21, 22, 5, 14, 0, 0, 22, 52, 1, 0, 0, 0, 23,
        24, 5, 21, 0, 0, 24, 52, 3, 4, 2, 18, 25, 26, 5, 9, 0, 0, 26, 27, 5, 15,
        0, 0, 27, 52, 3, 4, 2, 6, 28, 29, 5, 6, 0, 0, 29, 30, 3, 4, 2, 0, 30,
        31, 5, 7, 0, 0, 31, 32, 3, 4, 2, 0, 32, 33, 5, 8, 0, 0, 33, 34, 3, 4, 2,
        5, 34, 52, 1, 0, 0, 0, 35, 36, 5, 9, 0, 0, 36, 45, 5, 13, 0, 0, 37, 42,
        3, 4, 2, 0, 38, 39, 5, 12, 0, 0, 39, 41, 3, 4, 2, 0, 40, 38, 1, 0, 0, 0,
        41, 44, 1, 0, 0, 0, 42, 40, 1, 0, 0, 0, 42, 43, 1, 0, 0, 0, 43, 46, 1,
        0, 0, 0, 44, 42, 1, 0, 0, 0, 45, 37, 1, 0, 0, 0, 45, 46, 1, 0, 0, 0, 46,
        47, 1, 0, 0, 0, 47, 52, 5, 14, 0, 0, 48, 52, 5, 20, 0, 0, 49, 52, 5, 9,
        0, 0, 50, 52, 5, 11, 0, 0, 51, 18, 1, 0, 0, 0, 51, 23, 1, 0, 0, 0, 51,
        25, 1, 0, 0, 0, 51, 28, 1, 0, 0, 0, 51, 35, 1, 0, 0, 0, 51, 48, 1, 0, 0,
        0, 51, 49, 1, 0, 0, 0, 51, 50, 1, 0, 0, 0, 52, 98, 1, 0, 0, 0, 53, 54,
        10, 17, 0, 0, 54, 55, 5, 1, 0, 0, 55, 97, 3, 4, 2, 18, 56, 57, 10, 16,
        0, 0, 57, 58, 5, 2, 0, 0, 58, 97, 3, 4, 2, 17, 59, 60, 10, 15, 0, 0, 60,
        61, 5, 3, 0, 0, 61, 97, 3, 4, 2, 16, 62, 63, 10, 14, 0, 0, 63, 64, 5, 4,
        0, 0, 64, 97, 3, 4, 2, 15, 65, 66, 10, 13, 0, 0, 66, 67, 5, 5, 0, 0, 67,
        97, 3, 4, 2, 14, 68, 69, 10, 12, 0, 0, 69, 70, 5, 15, 0, 0, 70, 71, 5,
        15, 0, 0, 71, 97, 3, 4, 2, 13, 72, 73, 10, 11, 0, 0, 73, 74, 5, 21, 0,
        0, 74, 75, 5, 15, 0, 0, 75, 97, 3, 4, 2, 12, 76, 77, 10, 10, 0, 0, 77,
        79, 5, 16, 0, 0, 78, 80, 5, 15, 0, 0, 79, 78, 1, 0, 0, 0, 79, 80, 1, 0,
        0, 0, 80, 81, 1, 0, 0, 0, 81, 97, 3, 4, 2, 11, 82, 83, 10, 9, 0, 0, 83,
        85, 5, 17, 0, 0, 84, 86, 5, 15, 0, 0, 85, 84, 1, 0, 0, 0, 85, 86, 1, 0,
        0, 0, 86, 87, 1, 0, 0, 0, 87, 97, 3, 4, 2, 10, 88, 89, 10, 8, 0, 0, 89,
        90, 5, 18, 0, 0, 90, 91, 5, 18, 0, 0, 91, 97, 3, 4, 2, 9, 92, 93, 10, 7,
        0, 0, 93, 94, 5, 19, 0, 0, 94, 95, 5, 19, 0, 0, 95, 97, 3, 4, 2, 8, 96,
        53, 1, 0, 0, 0, 96, 56, 1, 0, 0, 0, 96, 59, 1, 0, 0, 0, 96, 62, 1, 0, 0,
        0, 96, 65, 1, 0, 0, 0, 96, 68, 1, 0, 0, 0, 96, 72, 1, 0, 0, 0, 96, 76,
        1, 0, 0, 0, 96, 82, 1, 0, 0, 0, 96, 88, 1, 0, 0, 0, 96, 92, 1, 0, 0, 0,
        97, 100, 1, 0, 0, 0, 98, 96, 1, 0, 0, 0, 98, 99, 1, 0, 0, 0, 99, 5, 1,
        0, 0, 0, 100, 98, 1, 0, 0, 0, 9, 9, 15, 42, 45, 51, 79, 85, 96, 98,
    ];

    private static __ATN: ATN;
    public static get _ATN(): ATN {
        if (!GrammarParser.__ATN) {
            GrammarParser.__ATN = new ATNDeserializer().deserialize(
                GrammarParser._serializedATN
            );
        }

        return GrammarParser.__ATN;
    }

    static DecisionsToDFA = GrammarParser._ATN.decisionToState.map(
        (ds: DecisionState, index: number) => new DFA(ds, index)
    );
}

export class ProgContext extends ParserRuleContext {
    constructor(
        parser?: GrammarParser,
        parent?: ParserRuleContext,
        invokingState?: number
    ) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public statement_list(): StatementContext[] {
        return this.getTypedRuleContexts(
            StatementContext
        ) as StatementContext[];
    }
    public statement(i: number): StatementContext {
        return this.getTypedRuleContext(
            StatementContext,
            i
        ) as StatementContext;
    }
    public get ruleIndex(): number {
        return GrammarParser.RULE_prog;
    }
    // @Override
    public accept<Result>(visitor: GrammarVisitor<Result>): Result {
        if (visitor.visitProg) {
            return visitor.visitProg(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}

export class StatementContext extends ParserRuleContext {
    constructor(
        parser?: GrammarParser,
        parent?: ParserRuleContext,
        invokingState?: number
    ) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public expr(): ExprContext {
        return this.getTypedRuleContext(ExprContext, 0) as ExprContext;
    }
    public NL_list(): TerminalNode[] {
        return this.getTokens(GrammarParser.NL);
    }
    public NL(i: number): TerminalNode {
        return this.getToken(GrammarParser.NL, i);
    }
    public get ruleIndex(): number {
        return GrammarParser.RULE_statement;
    }
    // @Override
    public accept<Result>(visitor: GrammarVisitor<Result>): Result {
        if (visitor.visitStatement) {
            return visitor.visitStatement(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}

export class ExprContext extends ParserRuleContext {
    constructor(
        parser?: GrammarParser,
        parent?: ParserRuleContext,
        invokingState?: number
    ) {
        super(parent, invokingState);
        this.parser = parser;
    }
    public get ruleIndex(): number {
        return GrammarParser.RULE_expr;
    }
    public copyFrom(ctx: ExprContext): void {
        super.copyFrom(ctx);
    }
}
export class IdentifierContext extends ExprContext {
    constructor(parser: GrammarParser, ctx: ExprContext) {
        super(parser, ctx.parentCtx, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public ID(): TerminalNode {
        return this.getToken(GrammarParser.ID, 0);
    }
    // @Override
    public accept<Result>(visitor: GrammarVisitor<Result>): Result {
        if (visitor.visitIdentifier) {
            return visitor.visitIdentifier(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class LogicalNotContext extends ExprContext {
    constructor(parser: GrammarParser, ctx: ExprContext) {
        super(parser, ctx.parentCtx, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public EXCLAM(): TerminalNode {
        return this.getToken(GrammarParser.EXCLAM, 0);
    }
    public expr(): ExprContext {
        return this.getTypedRuleContext(ExprContext, 0) as ExprContext;
    }
    // @Override
    public accept<Result>(visitor: GrammarVisitor<Result>): Result {
        if (visitor.visitLogicalNot) {
            return visitor.visitLogicalNot(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class MultilpyContext extends ExprContext {
    constructor(parser: GrammarParser, ctx: ExprContext) {
        super(parser, ctx.parentCtx, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public expr_list(): ExprContext[] {
        return this.getTypedRuleContexts(ExprContext) as ExprContext[];
    }
    public expr(i: number): ExprContext {
        return this.getTypedRuleContext(ExprContext, i) as ExprContext;
    }
    // @Override
    public accept<Result>(visitor: GrammarVisitor<Result>): Result {
        if (visitor.visitMultilpy) {
            return visitor.visitMultilpy(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class DisjunctionContext extends ExprContext {
    constructor(parser: GrammarParser, ctx: ExprContext) {
        super(parser, ctx.parentCtx, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public expr_list(): ExprContext[] {
        return this.getTypedRuleContexts(ExprContext) as ExprContext[];
    }
    public expr(i: number): ExprContext {
        return this.getTypedRuleContext(ExprContext, i) as ExprContext;
    }
    public PIPE_list(): TerminalNode[] {
        return this.getTokens(GrammarParser.PIPE);
    }
    public PIPE(i: number): TerminalNode {
        return this.getToken(GrammarParser.PIPE, i);
    }
    // @Override
    public accept<Result>(visitor: GrammarVisitor<Result>): Result {
        if (visitor.visitDisjunction) {
            return visitor.visitDisjunction(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class AssignmentContext extends ExprContext {
    constructor(parser: GrammarParser, ctx: ExprContext) {
        super(parser, ctx.parentCtx, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public ID(): TerminalNode {
        return this.getToken(GrammarParser.ID, 0);
    }
    public EQUAL(): TerminalNode {
        return this.getToken(GrammarParser.EQUAL, 0);
    }
    public expr(): ExprContext {
        return this.getTypedRuleContext(ExprContext, 0) as ExprContext;
    }
    // @Override
    public accept<Result>(visitor: GrammarVisitor<Result>): Result {
        if (visitor.visitAssignment) {
            return visitor.visitAssignment(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class NotEqualComparisonContext extends ExprContext {
    constructor(parser: GrammarParser, ctx: ExprContext) {
        super(parser, ctx.parentCtx, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public expr_list(): ExprContext[] {
        return this.getTypedRuleContexts(ExprContext) as ExprContext[];
    }
    public expr(i: number): ExprContext {
        return this.getTypedRuleContext(ExprContext, i) as ExprContext;
    }
    public EXCLAM(): TerminalNode {
        return this.getToken(GrammarParser.EXCLAM, 0);
    }
    public EQUAL(): TerminalNode {
        return this.getToken(GrammarParser.EQUAL, 0);
    }
    // @Override
    public accept<Result>(visitor: GrammarVisitor<Result>): Result {
        if (visitor.visitNotEqualComparison) {
            return visitor.visitNotEqualComparison(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class SubtractionContext extends ExprContext {
    constructor(parser: GrammarParser, ctx: ExprContext) {
        super(parser, ctx.parentCtx, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public expr_list(): ExprContext[] {
        return this.getTypedRuleContexts(ExprContext) as ExprContext[];
    }
    public expr(i: number): ExprContext {
        return this.getTypedRuleContext(ExprContext, i) as ExprContext;
    }
    // @Override
    public accept<Result>(visitor: GrammarVisitor<Result>): Result {
        if (visitor.visitSubtraction) {
            return visitor.visitSubtraction(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class LessComparisonContext extends ExprContext {
    constructor(parser: GrammarParser, ctx: ExprContext) {
        super(parser, ctx.parentCtx, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public expr_list(): ExprContext[] {
        return this.getTypedRuleContexts(ExprContext) as ExprContext[];
    }
    public expr(i: number): ExprContext {
        return this.getTypedRuleContext(ExprContext, i) as ExprContext;
    }
    public LESS(): TerminalNode {
        return this.getToken(GrammarParser.LESS, 0);
    }
    public EQUAL(): TerminalNode {
        return this.getToken(GrammarParser.EQUAL, 0);
    }
    // @Override
    public accept<Result>(visitor: GrammarVisitor<Result>): Result {
        if (visitor.visitLessComparison) {
            return visitor.visitLessComparison(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class ParenthesisContext extends ExprContext {
    constructor(parser: GrammarParser, ctx: ExprContext) {
        super(parser, ctx.parentCtx, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public LPAREN(): TerminalNode {
        return this.getToken(GrammarParser.LPAREN, 0);
    }
    public expr(): ExprContext {
        return this.getTypedRuleContext(ExprContext, 0) as ExprContext;
    }
    public RPAREN(): TerminalNode {
        return this.getToken(GrammarParser.RPAREN, 0);
    }
    // @Override
    public accept<Result>(visitor: GrammarVisitor<Result>): Result {
        if (visitor.visitParenthesis) {
            return visitor.visitParenthesis(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class DivisionContext extends ExprContext {
    constructor(parser: GrammarParser, ctx: ExprContext) {
        super(parser, ctx.parentCtx, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public expr_list(): ExprContext[] {
        return this.getTypedRuleContexts(ExprContext) as ExprContext[];
    }
    public expr(i: number): ExprContext {
        return this.getTypedRuleContext(ExprContext, i) as ExprContext;
    }
    // @Override
    public accept<Result>(visitor: GrammarVisitor<Result>): Result {
        if (visitor.visitDivision) {
            return visitor.visitDivision(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class StringValueContext extends ExprContext {
    constructor(parser: GrammarParser, ctx: ExprContext) {
        super(parser, ctx.parentCtx, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public STRING(): TerminalNode {
        return this.getToken(GrammarParser.STRING, 0);
    }
    // @Override
    public accept<Result>(visitor: GrammarVisitor<Result>): Result {
        if (visitor.visitStringValue) {
            return visitor.visitStringValue(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class GreaterComparisonContext extends ExprContext {
    constructor(parser: GrammarParser, ctx: ExprContext) {
        super(parser, ctx.parentCtx, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public expr_list(): ExprContext[] {
        return this.getTypedRuleContexts(ExprContext) as ExprContext[];
    }
    public expr(i: number): ExprContext {
        return this.getTypedRuleContext(ExprContext, i) as ExprContext;
    }
    public GREATER(): TerminalNode {
        return this.getToken(GrammarParser.GREATER, 0);
    }
    public EQUAL(): TerminalNode {
        return this.getToken(GrammarParser.EQUAL, 0);
    }
    // @Override
    public accept<Result>(visitor: GrammarVisitor<Result>): Result {
        if (visitor.visitGreaterComparison) {
            return visitor.visitGreaterComparison(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class ConjunctionContext extends ExprContext {
    constructor(parser: GrammarParser, ctx: ExprContext) {
        super(parser, ctx.parentCtx, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public expr_list(): ExprContext[] {
        return this.getTypedRuleContexts(ExprContext) as ExprContext[];
    }
    public expr(i: number): ExprContext {
        return this.getTypedRuleContext(ExprContext, i) as ExprContext;
    }
    public AMPERSAND_list(): TerminalNode[] {
        return this.getTokens(GrammarParser.AMPERSAND);
    }
    public AMPERSAND(i: number): TerminalNode {
        return this.getToken(GrammarParser.AMPERSAND, i);
    }
    // @Override
    public accept<Result>(visitor: GrammarVisitor<Result>): Result {
        if (visitor.visitConjunction) {
            return visitor.visitConjunction(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class FunctionCallContext extends ExprContext {
    constructor(parser: GrammarParser, ctx: ExprContext) {
        super(parser, ctx.parentCtx, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public ID(): TerminalNode {
        return this.getToken(GrammarParser.ID, 0);
    }
    public LPAREN(): TerminalNode {
        return this.getToken(GrammarParser.LPAREN, 0);
    }
    public RPAREN(): TerminalNode {
        return this.getToken(GrammarParser.RPAREN, 0);
    }
    public expr_list(): ExprContext[] {
        return this.getTypedRuleContexts(ExprContext) as ExprContext[];
    }
    public expr(i: number): ExprContext {
        return this.getTypedRuleContext(ExprContext, i) as ExprContext;
    }
    public COMMA_list(): TerminalNode[] {
        return this.getTokens(GrammarParser.COMMA);
    }
    public COMMA(i: number): TerminalNode {
        return this.getToken(GrammarParser.COMMA, i);
    }
    // @Override
    public accept<Result>(visitor: GrammarVisitor<Result>): Result {
        if (visitor.visitFunctionCall) {
            return visitor.visitFunctionCall(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class NumberValueContext extends ExprContext {
    constructor(parser: GrammarParser, ctx: ExprContext) {
        super(parser, ctx.parentCtx, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public NUM(): TerminalNode {
        return this.getToken(GrammarParser.NUM, 0);
    }
    // @Override
    public accept<Result>(visitor: GrammarVisitor<Result>): Result {
        if (visitor.visitNumberValue) {
            return visitor.visitNumberValue(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class IfExpressionContext extends ExprContext {
    constructor(parser: GrammarParser, ctx: ExprContext) {
        super(parser, ctx.parentCtx, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public expr_list(): ExprContext[] {
        return this.getTypedRuleContexts(ExprContext) as ExprContext[];
    }
    public expr(i: number): ExprContext {
        return this.getTypedRuleContext(ExprContext, i) as ExprContext;
    }
    // @Override
    public accept<Result>(visitor: GrammarVisitor<Result>): Result {
        if (visitor.visitIfExpression) {
            return visitor.visitIfExpression(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class ModuloContext extends ExprContext {
    constructor(parser: GrammarParser, ctx: ExprContext) {
        super(parser, ctx.parentCtx, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public expr_list(): ExprContext[] {
        return this.getTypedRuleContexts(ExprContext) as ExprContext[];
    }
    public expr(i: number): ExprContext {
        return this.getTypedRuleContext(ExprContext, i) as ExprContext;
    }
    // @Override
    public accept<Result>(visitor: GrammarVisitor<Result>): Result {
        if (visitor.visitModulo) {
            return visitor.visitModulo(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class EqualComparisonContext extends ExprContext {
    constructor(parser: GrammarParser, ctx: ExprContext) {
        super(parser, ctx.parentCtx, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public expr_list(): ExprContext[] {
        return this.getTypedRuleContexts(ExprContext) as ExprContext[];
    }
    public expr(i: number): ExprContext {
        return this.getTypedRuleContext(ExprContext, i) as ExprContext;
    }
    public EQUAL_list(): TerminalNode[] {
        return this.getTokens(GrammarParser.EQUAL);
    }
    public EQUAL(i: number): TerminalNode {
        return this.getToken(GrammarParser.EQUAL, i);
    }
    // @Override
    public accept<Result>(visitor: GrammarVisitor<Result>): Result {
        if (visitor.visitEqualComparison) {
            return visitor.visitEqualComparison(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class AdditionContext extends ExprContext {
    constructor(parser: GrammarParser, ctx: ExprContext) {
        super(parser, ctx.parentCtx, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public expr_list(): ExprContext[] {
        return this.getTypedRuleContexts(ExprContext) as ExprContext[];
    }
    public expr(i: number): ExprContext {
        return this.getTypedRuleContext(ExprContext, i) as ExprContext;
    }
    // @Override
    public accept<Result>(visitor: GrammarVisitor<Result>): Result {
        if (visitor.visitAddition) {
            return visitor.visitAddition(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
