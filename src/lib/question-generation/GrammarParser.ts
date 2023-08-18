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
    public static readonly BOOLEAN = 5;
    public static readonly ID = 6;
    public static readonly WS = 7;
    public static readonly NUM = 8;
    public static readonly COMMA = 9;
    public static readonly LPAREN = 10;
    public static readonly RPAREN = 11;
    public static readonly EQUAL = 12;
    public static readonly GREATER = 13;
    public static readonly LESS = 14;
    public static readonly AMPERSAND = 15;
    public static readonly PIPE = 16;
    public static readonly STRING = 17;
    public static readonly EXCLAM = 18;
    public static readonly NL = 19;
    public static readonly ASTERISK = 20;
    public static readonly SLASH = 21;
    public static readonly PERCENT = 22;
    public static readonly PLUS = 23;
    public static readonly MINUS = 24;
    public static readonly EOF = Token.EOF;
    public static readonly RULE_prog = 0;
    public static readonly RULE_statement = 1;
    public static readonly RULE_assignmentStatement = 2;
    public static readonly RULE_ifStatement = 3;
    public static readonly RULE_blockStatement = 4;
    public static readonly RULE_expr = 5;
    public static readonly literalNames: (string | null)[] = [
        null,
        "'if'",
        "'else'",
        "'{'",
        "'}'",
        null,
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
        "'*'",
        "'/'",
        "'%'",
        "'+'",
        "'-'",
    ];
    public static readonly symbolicNames: (string | null)[] = [
        null,
        null,
        null,
        null,
        null,
        "BOOLEAN",
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
        "ASTERISK",
        "SLASH",
        "PERCENT",
        "PLUS",
        "MINUS",
    ];
    // tslint:disable:no-trailing-whitespace
    public static readonly ruleNames: string[] = [
        "prog",
        "statement",
        "assignmentStatement",
        "ifStatement",
        "blockStatement",
        "expr",
    ];
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
                this.state = 13;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                do {
                    {
                        {
                            this.state = 12;
                            this.statement();
                        }
                    }
                    this.state = 15;
                    this._errHandler.sync(this);
                    _la = this._input.LA(1);
                } while ((_la & ~0x1f) === 0 && ((1 << _la) & 74) !== 0);
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
        try {
            let _alt: number;
            this.state = 38;
            this._errHandler.sync(this);
            switch (this._input.LA(1)) {
                case 6:
                    this.enterOuterAlt(localctx, 1);
                    {
                        this.state = 17;
                        this.assignmentStatement();
                        this.state = 21;
                        this._errHandler.sync(this);
                        _alt = this._interp.adaptivePredict(
                            this._input,
                            1,
                            this._ctx
                        );
                        while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
                            if (_alt === 1) {
                                {
                                    {
                                        this.state = 18;
                                        this.match(GrammarParser.NL);
                                    }
                                }
                            }
                            this.state = 23;
                            this._errHandler.sync(this);
                            _alt = this._interp.adaptivePredict(
                                this._input,
                                1,
                                this._ctx
                            );
                        }
                    }
                    break;
                case 1:
                    this.enterOuterAlt(localctx, 2);
                    {
                        this.state = 24;
                        this.ifStatement();
                        this.state = 28;
                        this._errHandler.sync(this);
                        _alt = this._interp.adaptivePredict(
                            this._input,
                            2,
                            this._ctx
                        );
                        while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
                            if (_alt === 1) {
                                {
                                    {
                                        this.state = 25;
                                        this.match(GrammarParser.NL);
                                    }
                                }
                            }
                            this.state = 30;
                            this._errHandler.sync(this);
                            _alt = this._interp.adaptivePredict(
                                this._input,
                                2,
                                this._ctx
                            );
                        }
                    }
                    break;
                case 3:
                    this.enterOuterAlt(localctx, 3);
                    {
                        this.state = 31;
                        this.blockStatement();
                        this.state = 35;
                        this._errHandler.sync(this);
                        _alt = this._interp.adaptivePredict(
                            this._input,
                            3,
                            this._ctx
                        );
                        while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
                            if (_alt === 1) {
                                {
                                    {
                                        this.state = 32;
                                        this.match(GrammarParser.NL);
                                    }
                                }
                            }
                            this.state = 37;
                            this._errHandler.sync(this);
                            _alt = this._interp.adaptivePredict(
                                this._input,
                                3,
                                this._ctx
                            );
                        }
                    }
                    break;
                default:
                    throw new NoViableAltException(this);
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
    public assignmentStatement(): AssignmentStatementContext {
        const localctx: AssignmentStatementContext =
            new AssignmentStatementContext(this, this._ctx, this.state);
        this.enterRule(localctx, 4, GrammarParser.RULE_assignmentStatement);
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 40;
                this.match(GrammarParser.ID);
                this.state = 41;
                this.match(GrammarParser.EQUAL);
                this.state = 42;
                this.expr(0);
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
    public ifStatement(): IfStatementContext {
        const localctx: IfStatementContext = new IfStatementContext(
            this,
            this._ctx,
            this.state
        );
        this.enterRule(localctx, 6, GrammarParser.RULE_ifStatement);
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 44;
                this.match(GrammarParser.T__0);
                this.state = 45;
                this.expr(0);
                this.state = 46;
                this.statement();
                this.state = 47;
                this.match(GrammarParser.T__1);
                this.state = 48;
                this.statement();
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
    public blockStatement(): BlockStatementContext {
        const localctx: BlockStatementContext = new BlockStatementContext(
            this,
            this._ctx,
            this.state
        );
        this.enterRule(localctx, 8, GrammarParser.RULE_blockStatement);
        let _la: number;
        try {
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 50;
                this.match(GrammarParser.T__2);
                this.state = 54;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                while ((_la & ~0x1f) === 0 && ((1 << _la) & 74) !== 0) {
                    {
                        {
                            this.state = 51;
                            this.statement();
                        }
                    }
                    this.state = 56;
                    this._errHandler.sync(this);
                    _la = this._input.LA(1);
                }
                this.state = 57;
                this.match(GrammarParser.T__3);
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
        const _startState = 10;
        this.enterRecursionRule(localctx, 10, GrammarParser.RULE_expr, _p);
        let _la: number;
        try {
            let _alt: number;
            this.enterOuterAlt(localctx, 1);
            {
                this.state = 83;
                this._errHandler.sync(this);
                switch (
                    this._interp.adaptivePredict(this._input, 8, this._ctx)
                ) {
                    case 1:
                        {
                            localctx = new ParenthesisContext(this, localctx);
                            this._ctx = localctx;
                            _prevctx = localctx;

                            this.state = 60;
                            this.match(GrammarParser.LPAREN);
                            this.state = 61;
                            this.expr(0);
                            this.state = 62;
                            this.match(GrammarParser.RPAREN);
                        }
                        break;
                    case 2:
                        {
                            localctx = new LogicalNotContext(this, localctx);
                            this._ctx = localctx;
                            _prevctx = localctx;
                            this.state = 64;
                            this.match(GrammarParser.EXCLAM);
                            this.state = 65;
                            this.expr(11);
                        }
                        break;
                    case 3:
                        {
                            localctx = new UnaryPlusMinusContext(
                                this,
                                localctx
                            );
                            this._ctx = localctx;
                            _prevctx = localctx;
                            this.state = 66;
                            _la = this._input.LA(1);
                            if (!(_la === 23 || _la === 24)) {
                                this._errHandler.recoverInline(this);
                            } else {
                                this._errHandler.reportMatch(this);
                                this.consume();
                            }
                            this.state = 67;
                            this.expr(10);
                        }
                        break;
                    case 4:
                        {
                            localctx = new FunctionCallContext(this, localctx);
                            this._ctx = localctx;
                            _prevctx = localctx;
                            this.state = 68;
                            this.match(GrammarParser.ID);
                            this.state = 69;
                            this.match(GrammarParser.LPAREN);
                            this.state = 78;
                            this._errHandler.sync(this);
                            _la = this._input.LA(1);
                            if (
                                (_la & ~0x1f) === 0 &&
                                ((1 << _la) & 25560416) !== 0
                            ) {
                                {
                                    this.state = 70;
                                    this.expr(0);
                                    this.state = 75;
                                    this._errHandler.sync(this);
                                    _la = this._input.LA(1);
                                    while (_la === 9) {
                                        {
                                            {
                                                this.state = 71;
                                                this.match(GrammarParser.COMMA);
                                                this.state = 72;
                                                this.expr(0);
                                            }
                                        }
                                        this.state = 77;
                                        this._errHandler.sync(this);
                                        _la = this._input.LA(1);
                                    }
                                }
                            }

                            this.state = 80;
                            this.match(GrammarParser.RPAREN);
                        }
                        break;
                    case 5:
                        {
                            localctx = new IdentifierContext(this, localctx);
                            this._ctx = localctx;
                            _prevctx = localctx;
                            this.state = 81;
                            this.match(GrammarParser.ID);
                        }
                        break;
                    case 6:
                        {
                            localctx = new LiteralContext(this, localctx);
                            this._ctx = localctx;
                            _prevctx = localctx;
                            this.state = 82;
                            _la = this._input.LA(1);
                            if (
                                !(
                                    (_la & ~0x1f) === 0 &&
                                    ((1 << _la) & 131360) !== 0
                                )
                            ) {
                                this._errHandler.recoverInline(this);
                            } else {
                                this._errHandler.reportMatch(this);
                                this.consume();
                            }
                        }
                        break;
                }
                this._ctx.stop = this._input.LT(-1);
                this.state = 111;
                this._errHandler.sync(this);
                _alt = this._interp.adaptivePredict(this._input, 11, this._ctx);
                while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
                    if (_alt === 1) {
                        if (this._parseListeners != null) {
                            this.triggerExitRuleEvent();
                        }
                        _prevctx = localctx;
                        {
                            this.state = 109;
                            this._errHandler.sync(this);
                            switch (
                                this._interp.adaptivePredict(
                                    this._input,
                                    10,
                                    this._ctx
                                )
                            ) {
                                case 1:
                                    {
                                        localctx =
                                            new MultiplyDivideModuloContext(
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
                                        this.state = 85;
                                        if (!this.precpred(this._ctx, 9)) {
                                            throw this.createFailedPredicateException(
                                                "this.precpred(this._ctx, 9)"
                                            );
                                        }
                                        this.state = 86;
                                        _la = this._input.LA(1);
                                        if (
                                            !(
                                                (_la & ~0x1f) === 0 &&
                                                ((1 << _la) & 7340032) !== 0
                                            )
                                        ) {
                                            this._errHandler.recoverInline(
                                                this
                                            );
                                        } else {
                                            this._errHandler.reportMatch(this);
                                            this.consume();
                                        }
                                        this.state = 87;
                                        this.expr(10);
                                    }
                                    break;
                                case 2:
                                    {
                                        localctx = new AddSubtractContext(
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
                                        _la = this._input.LA(1);
                                        if (!(_la === 23 || _la === 24)) {
                                            this._errHandler.recoverInline(
                                                this
                                            );
                                        } else {
                                            this._errHandler.reportMatch(this);
                                            this.consume();
                                        }
                                        this.state = 90;
                                        this.expr(9);
                                    }
                                    break;
                                case 3:
                                    {
                                        localctx =
                                            new NonEqualityComparisonContext(
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
                                        this.state = 91;
                                        if (!this.precpred(this._ctx, 7)) {
                                            throw this.createFailedPredicateException(
                                                "this.precpred(this._ctx, 7)"
                                            );
                                        }
                                        this.state = 92;
                                        _la = this._input.LA(1);
                                        if (!(_la === 13 || _la === 14)) {
                                            this._errHandler.recoverInline(
                                                this
                                            );
                                        } else {
                                            this._errHandler.reportMatch(this);
                                            this.consume();
                                        }
                                        this.state = 94;
                                        this._errHandler.sync(this);
                                        _la = this._input.LA(1);
                                        if (_la === 12) {
                                            {
                                                this.state = 93;
                                                this.match(GrammarParser.EQUAL);
                                            }
                                        }

                                        this.state = 96;
                                        this.expr(8);
                                    }
                                    break;
                                case 4:
                                    {
                                        localctx =
                                            new EqualityComparisonContext(
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
                                        this.state = 97;
                                        if (!this.precpred(this._ctx, 6)) {
                                            throw this.createFailedPredicateException(
                                                "this.precpred(this._ctx, 6)"
                                            );
                                        }
                                        this.state = 98;
                                        _la = this._input.LA(1);
                                        if (!(_la === 12 || _la === 18)) {
                                            this._errHandler.recoverInline(
                                                this
                                            );
                                        } else {
                                            this._errHandler.reportMatch(this);
                                            this.consume();
                                        }
                                        this.state = 99;
                                        this.match(GrammarParser.EQUAL);
                                        this.state = 100;
                                        this.expr(7);
                                    }
                                    break;
                                case 5:
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
                                        this.state = 101;
                                        if (!this.precpred(this._ctx, 5)) {
                                            throw this.createFailedPredicateException(
                                                "this.precpred(this._ctx, 5)"
                                            );
                                        }
                                        this.state = 102;
                                        this.match(GrammarParser.AMPERSAND);
                                        this.state = 103;
                                        this.match(GrammarParser.AMPERSAND);
                                        this.state = 104;
                                        this.expr(6);
                                    }
                                    break;
                                case 6:
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
                                        this.state = 105;
                                        if (!this.precpred(this._ctx, 4)) {
                                            throw this.createFailedPredicateException(
                                                "this.precpred(this._ctx, 4)"
                                            );
                                        }
                                        this.state = 106;
                                        this.match(GrammarParser.PIPE);
                                        this.state = 107;
                                        this.match(GrammarParser.PIPE);
                                        this.state = 108;
                                        this.expr(5);
                                    }
                                    break;
                            }
                        }
                    }
                    this.state = 113;
                    this._errHandler.sync(this);
                    _alt = this._interp.adaptivePredict(
                        this._input,
                        11,
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
            case 5:
                return this.expr_sempred(localctx as ExprContext, predIndex);
        }
        return true;
    }
    private expr_sempred(localctx: ExprContext, predIndex: number): boolean {
        switch (predIndex) {
            case 0:
                return this.precpred(this._ctx, 9);
            case 1:
                return this.precpred(this._ctx, 8);
            case 2:
                return this.precpred(this._ctx, 7);
            case 3:
                return this.precpred(this._ctx, 6);
            case 4:
                return this.precpred(this._ctx, 5);
            case 5:
                return this.precpred(this._ctx, 4);
        }
        return true;
    }

    public static readonly _serializedATN: number[] = [
        4, 1, 24, 115, 2, 0, 7, 0, 2, 1, 7, 1, 2, 2, 7, 2, 2, 3, 7, 3, 2, 4, 7,
        4, 2, 5, 7, 5, 1, 0, 4, 0, 14, 8, 0, 11, 0, 12, 0, 15, 1, 1, 1, 1, 5, 1,
        20, 8, 1, 10, 1, 12, 1, 23, 9, 1, 1, 1, 1, 1, 5, 1, 27, 8, 1, 10, 1, 12,
        1, 30, 9, 1, 1, 1, 1, 1, 5, 1, 34, 8, 1, 10, 1, 12, 1, 37, 9, 1, 3, 1,
        39, 8, 1, 1, 2, 1, 2, 1, 2, 1, 2, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1,
        4, 1, 4, 5, 4, 53, 8, 4, 10, 4, 12, 4, 56, 9, 4, 1, 4, 1, 4, 1, 5, 1, 5,
        1, 5, 1, 5, 1, 5, 1, 5, 1, 5, 1, 5, 1, 5, 1, 5, 1, 5, 1, 5, 1, 5, 1, 5,
        5, 5, 74, 8, 5, 10, 5, 12, 5, 77, 9, 5, 3, 5, 79, 8, 5, 1, 5, 1, 5, 1,
        5, 3, 5, 84, 8, 5, 1, 5, 1, 5, 1, 5, 1, 5, 1, 5, 1, 5, 1, 5, 1, 5, 1, 5,
        3, 5, 95, 8, 5, 1, 5, 1, 5, 1, 5, 1, 5, 1, 5, 1, 5, 1, 5, 1, 5, 1, 5, 1,
        5, 1, 5, 1, 5, 1, 5, 5, 5, 110, 8, 5, 10, 5, 12, 5, 113, 9, 5, 1, 5, 0,
        1, 10, 6, 0, 2, 4, 6, 8, 10, 0, 5, 1, 0, 23, 24, 3, 0, 5, 5, 8, 8, 17,
        17, 1, 0, 20, 22, 1, 0, 13, 14, 2, 0, 12, 12, 18, 18, 129, 0, 13, 1, 0,
        0, 0, 2, 38, 1, 0, 0, 0, 4, 40, 1, 0, 0, 0, 6, 44, 1, 0, 0, 0, 8, 50, 1,
        0, 0, 0, 10, 83, 1, 0, 0, 0, 12, 14, 3, 2, 1, 0, 13, 12, 1, 0, 0, 0, 14,
        15, 1, 0, 0, 0, 15, 13, 1, 0, 0, 0, 15, 16, 1, 0, 0, 0, 16, 1, 1, 0, 0,
        0, 17, 21, 3, 4, 2, 0, 18, 20, 5, 19, 0, 0, 19, 18, 1, 0, 0, 0, 20, 23,
        1, 0, 0, 0, 21, 19, 1, 0, 0, 0, 21, 22, 1, 0, 0, 0, 22, 39, 1, 0, 0, 0,
        23, 21, 1, 0, 0, 0, 24, 28, 3, 6, 3, 0, 25, 27, 5, 19, 0, 0, 26, 25, 1,
        0, 0, 0, 27, 30, 1, 0, 0, 0, 28, 26, 1, 0, 0, 0, 28, 29, 1, 0, 0, 0, 29,
        39, 1, 0, 0, 0, 30, 28, 1, 0, 0, 0, 31, 35, 3, 8, 4, 0, 32, 34, 5, 19,
        0, 0, 33, 32, 1, 0, 0, 0, 34, 37, 1, 0, 0, 0, 35, 33, 1, 0, 0, 0, 35,
        36, 1, 0, 0, 0, 36, 39, 1, 0, 0, 0, 37, 35, 1, 0, 0, 0, 38, 17, 1, 0, 0,
        0, 38, 24, 1, 0, 0, 0, 38, 31, 1, 0, 0, 0, 39, 3, 1, 0, 0, 0, 40, 41, 5,
        6, 0, 0, 41, 42, 5, 12, 0, 0, 42, 43, 3, 10, 5, 0, 43, 5, 1, 0, 0, 0,
        44, 45, 5, 1, 0, 0, 45, 46, 3, 10, 5, 0, 46, 47, 3, 2, 1, 0, 47, 48, 5,
        2, 0, 0, 48, 49, 3, 2, 1, 0, 49, 7, 1, 0, 0, 0, 50, 54, 5, 3, 0, 0, 51,
        53, 3, 2, 1, 0, 52, 51, 1, 0, 0, 0, 53, 56, 1, 0, 0, 0, 54, 52, 1, 0, 0,
        0, 54, 55, 1, 0, 0, 0, 55, 57, 1, 0, 0, 0, 56, 54, 1, 0, 0, 0, 57, 58,
        5, 4, 0, 0, 58, 9, 1, 0, 0, 0, 59, 60, 6, 5, -1, 0, 60, 61, 5, 10, 0, 0,
        61, 62, 3, 10, 5, 0, 62, 63, 5, 11, 0, 0, 63, 84, 1, 0, 0, 0, 64, 65, 5,
        18, 0, 0, 65, 84, 3, 10, 5, 11, 66, 67, 7, 0, 0, 0, 67, 84, 3, 10, 5,
        10, 68, 69, 5, 6, 0, 0, 69, 78, 5, 10, 0, 0, 70, 75, 3, 10, 5, 0, 71,
        72, 5, 9, 0, 0, 72, 74, 3, 10, 5, 0, 73, 71, 1, 0, 0, 0, 74, 77, 1, 0,
        0, 0, 75, 73, 1, 0, 0, 0, 75, 76, 1, 0, 0, 0, 76, 79, 1, 0, 0, 0, 77,
        75, 1, 0, 0, 0, 78, 70, 1, 0, 0, 0, 78, 79, 1, 0, 0, 0, 79, 80, 1, 0, 0,
        0, 80, 84, 5, 11, 0, 0, 81, 84, 5, 6, 0, 0, 82, 84, 7, 1, 0, 0, 83, 59,
        1, 0, 0, 0, 83, 64, 1, 0, 0, 0, 83, 66, 1, 0, 0, 0, 83, 68, 1, 0, 0, 0,
        83, 81, 1, 0, 0, 0, 83, 82, 1, 0, 0, 0, 84, 111, 1, 0, 0, 0, 85, 86, 10,
        9, 0, 0, 86, 87, 7, 2, 0, 0, 87, 110, 3, 10, 5, 10, 88, 89, 10, 8, 0, 0,
        89, 90, 7, 0, 0, 0, 90, 110, 3, 10, 5, 9, 91, 92, 10, 7, 0, 0, 92, 94,
        7, 3, 0, 0, 93, 95, 5, 12, 0, 0, 94, 93, 1, 0, 0, 0, 94, 95, 1, 0, 0, 0,
        95, 96, 1, 0, 0, 0, 96, 110, 3, 10, 5, 8, 97, 98, 10, 6, 0, 0, 98, 99,
        7, 4, 0, 0, 99, 100, 5, 12, 0, 0, 100, 110, 3, 10, 5, 7, 101, 102, 10,
        5, 0, 0, 102, 103, 5, 15, 0, 0, 103, 104, 5, 15, 0, 0, 104, 110, 3, 10,
        5, 6, 105, 106, 10, 4, 0, 0, 106, 107, 5, 16, 0, 0, 107, 108, 5, 16, 0,
        0, 108, 110, 3, 10, 5, 5, 109, 85, 1, 0, 0, 0, 109, 88, 1, 0, 0, 0, 109,
        91, 1, 0, 0, 0, 109, 97, 1, 0, 0, 0, 109, 101, 1, 0, 0, 0, 109, 105, 1,
        0, 0, 0, 110, 113, 1, 0, 0, 0, 111, 109, 1, 0, 0, 0, 111, 112, 1, 0, 0,
        0, 112, 11, 1, 0, 0, 0, 113, 111, 1, 0, 0, 0, 12, 15, 21, 28, 35, 38,
        54, 75, 78, 83, 94, 109, 111,
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
    public assignmentStatement(): AssignmentStatementContext {
        return this.getTypedRuleContext(
            AssignmentStatementContext,
            0
        ) as AssignmentStatementContext;
    }
    public NL_list(): TerminalNode[] {
        return this.getTokens(GrammarParser.NL);
    }
    public NL(i: number): TerminalNode {
        return this.getToken(GrammarParser.NL, i);
    }
    public ifStatement(): IfStatementContext {
        return this.getTypedRuleContext(
            IfStatementContext,
            0
        ) as IfStatementContext;
    }
    public blockStatement(): BlockStatementContext {
        return this.getTypedRuleContext(
            BlockStatementContext,
            0
        ) as BlockStatementContext;
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

export class AssignmentStatementContext extends ParserRuleContext {
    constructor(
        parser?: GrammarParser,
        parent?: ParserRuleContext,
        invokingState?: number
    ) {
        super(parent, invokingState);
        this.parser = parser;
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
    public get ruleIndex(): number {
        return GrammarParser.RULE_assignmentStatement;
    }
    // @Override
    public accept<Result>(visitor: GrammarVisitor<Result>): Result {
        if (visitor.visitAssignmentStatement) {
            return visitor.visitAssignmentStatement(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}

export class IfStatementContext extends ParserRuleContext {
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
        return GrammarParser.RULE_ifStatement;
    }
    // @Override
    public accept<Result>(visitor: GrammarVisitor<Result>): Result {
        if (visitor.visitIfStatement) {
            return visitor.visitIfStatement(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}

export class BlockStatementContext extends ParserRuleContext {
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
        return GrammarParser.RULE_blockStatement;
    }
    // @Override
    public accept<Result>(visitor: GrammarVisitor<Result>): Result {
        if (visitor.visitBlockStatement) {
            return visitor.visitBlockStatement(this);
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
export class MultiplyDivideModuloContext extends ExprContext {
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
    public ASTERISK(): TerminalNode {
        return this.getToken(GrammarParser.ASTERISK, 0);
    }
    public SLASH(): TerminalNode {
        return this.getToken(GrammarParser.SLASH, 0);
    }
    public PERCENT(): TerminalNode {
        return this.getToken(GrammarParser.PERCENT, 0);
    }
    // @Override
    public accept<Result>(visitor: GrammarVisitor<Result>): Result {
        if (visitor.visitMultiplyDivideModulo) {
            return visitor.visitMultiplyDivideModulo(this);
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
export class AddSubtractContext extends ExprContext {
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
    public PLUS(): TerminalNode {
        return this.getToken(GrammarParser.PLUS, 0);
    }
    public MINUS(): TerminalNode {
        return this.getToken(GrammarParser.MINUS, 0);
    }
    // @Override
    public accept<Result>(visitor: GrammarVisitor<Result>): Result {
        if (visitor.visitAddSubtract) {
            return visitor.visitAddSubtract(this);
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
export class NonEqualityComparisonContext extends ExprContext {
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
    public LESS(): TerminalNode {
        return this.getToken(GrammarParser.LESS, 0);
    }
    public EQUAL(): TerminalNode {
        return this.getToken(GrammarParser.EQUAL, 0);
    }
    // @Override
    public accept<Result>(visitor: GrammarVisitor<Result>): Result {
        if (visitor.visitNonEqualityComparison) {
            return visitor.visitNonEqualityComparison(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class UnaryPlusMinusContext extends ExprContext {
    constructor(parser: GrammarParser, ctx: ExprContext) {
        super(parser, ctx.parentCtx, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public expr(): ExprContext {
        return this.getTypedRuleContext(ExprContext, 0) as ExprContext;
    }
    public PLUS(): TerminalNode {
        return this.getToken(GrammarParser.PLUS, 0);
    }
    public MINUS(): TerminalNode {
        return this.getToken(GrammarParser.MINUS, 0);
    }
    // @Override
    public accept<Result>(visitor: GrammarVisitor<Result>): Result {
        if (visitor.visitUnaryPlusMinus) {
            return visitor.visitUnaryPlusMinus(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class EqualityComparisonContext extends ExprContext {
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
    public EXCLAM(): TerminalNode {
        return this.getToken(GrammarParser.EXCLAM, 0);
    }
    // @Override
    public accept<Result>(visitor: GrammarVisitor<Result>): Result {
        if (visitor.visitEqualityComparison) {
            return visitor.visitEqualityComparison(this);
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
export class LiteralContext extends ExprContext {
    constructor(parser: GrammarParser, ctx: ExprContext) {
        super(parser, ctx.parentCtx, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public BOOLEAN(): TerminalNode {
        return this.getToken(GrammarParser.BOOLEAN, 0);
    }
    public STRING(): TerminalNode {
        return this.getToken(GrammarParser.STRING, 0);
    }
    public NUM(): TerminalNode {
        return this.getToken(GrammarParser.NUM, 0);
    }
    // @Override
    public accept<Result>(visitor: GrammarVisitor<Result>): Result {
        if (visitor.visitLiteral) {
            return visitor.visitLiteral(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
