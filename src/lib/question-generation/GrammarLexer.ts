// Generated from Grammar.g4 by ANTLR 4.13.0
// noinspection ES6UnusedImports,JSUnusedGlobalSymbols,JSUnusedLocalSymbols
import {
    ATN,
    ATNDeserializer,
    CharStream,
    DecisionState,
    DFA,
    Lexer,
    LexerATNSimulator,
    RuleContext,
    PredictionContextCache,
    Token,
} from "antlr4";
export default class GrammarLexer extends Lexer {
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

    public static readonly channelNames: string[] = [
        "DEFAULT_TOKEN_CHANNEL",
        "HIDDEN",
    ];
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
    public static readonly modeNames: string[] = ["DEFAULT_MODE"];

    public static readonly ruleNames: string[] = [
        "T__0",
        "T__1",
        "T__2",
        "T__3",
        "T__4",
        "T__5",
        "T__6",
        "T__7",
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

    constructor(input: CharStream) {
        super(input);
        this._interp = new LexerATNSimulator(
            this,
            GrammarLexer._ATN,
            GrammarLexer.DecisionsToDFA,
            new PredictionContextCache()
        );
    }

    public get grammarFileName(): string {
        return "Grammar.g4";
    }

    public get literalNames(): (string | null)[] {
        return GrammarLexer.literalNames;
    }
    public get symbolicNames(): (string | null)[] {
        return GrammarLexer.symbolicNames;
    }
    public get ruleNames(): string[] {
        return GrammarLexer.ruleNames;
    }

    public get serializedATN(): number[] {
        return GrammarLexer._serializedATN;
    }

    public get channelNames(): string[] {
        return GrammarLexer.channelNames;
    }

    public get modeNames(): string[] {
        return GrammarLexer.modeNames;
    }

    public static readonly _serializedATN: number[] = [
        4, 0, 22, 136, 6, -1, 2, 0, 7, 0, 2, 1, 7, 1, 2, 2, 7, 2, 2, 3, 7, 3, 2,
        4, 7, 4, 2, 5, 7, 5, 2, 6, 7, 6, 2, 7, 7, 7, 2, 8, 7, 8, 2, 9, 7, 9, 2,
        10, 7, 10, 2, 11, 7, 11, 2, 12, 7, 12, 2, 13, 7, 13, 2, 14, 7, 14, 2,
        15, 7, 15, 2, 16, 7, 16, 2, 17, 7, 17, 2, 18, 7, 18, 2, 19, 7, 19, 2,
        20, 7, 20, 2, 21, 7, 21, 1, 0, 1, 0, 1, 1, 1, 1, 1, 2, 1, 2, 1, 3, 1, 3,
        1, 4, 1, 4, 1, 5, 1, 5, 1, 5, 1, 6, 1, 6, 1, 6, 1, 6, 1, 6, 1, 7, 1, 7,
        1, 7, 1, 7, 1, 7, 1, 8, 1, 8, 5, 8, 71, 8, 8, 10, 8, 12, 8, 74, 9, 8, 1,
        9, 4, 9, 77, 8, 9, 11, 9, 12, 9, 78, 1, 9, 1, 9, 1, 10, 3, 10, 84, 8,
        10, 1, 10, 4, 10, 87, 8, 10, 11, 10, 12, 10, 88, 1, 10, 1, 10, 4, 10,
        93, 8, 10, 11, 10, 12, 10, 94, 3, 10, 97, 8, 10, 1, 11, 1, 11, 1, 12, 1,
        12, 1, 13, 1, 13, 1, 14, 1, 14, 1, 15, 1, 15, 1, 16, 1, 16, 1, 17, 1,
        17, 1, 18, 1, 18, 1, 19, 1, 19, 5, 19, 117, 8, 19, 10, 19, 12, 19, 120,
        9, 19, 1, 19, 1, 19, 1, 19, 5, 19, 125, 8, 19, 10, 19, 12, 19, 128, 9,
        19, 1, 19, 3, 19, 131, 8, 19, 1, 20, 1, 20, 1, 21, 1, 21, 0, 0, 22, 1,
        1, 3, 2, 5, 3, 7, 4, 9, 5, 11, 6, 13, 7, 15, 8, 17, 9, 19, 10, 21, 11,
        23, 12, 25, 13, 27, 14, 29, 15, 31, 16, 33, 17, 35, 18, 37, 19, 39, 20,
        41, 21, 43, 22, 1, 0, 6, 3, 0, 65, 90, 95, 95, 97, 122, 4, 0, 48, 57,
        65, 90, 95, 95, 97, 122, 3, 0, 9, 10, 13, 13, 32, 32, 1, 0, 48, 57, 1,
        0, 34, 34, 1, 0, 39, 39, 144, 0, 1, 1, 0, 0, 0, 0, 3, 1, 0, 0, 0, 0, 5,
        1, 0, 0, 0, 0, 7, 1, 0, 0, 0, 0, 9, 1, 0, 0, 0, 0, 11, 1, 0, 0, 0, 0,
        13, 1, 0, 0, 0, 0, 15, 1, 0, 0, 0, 0, 17, 1, 0, 0, 0, 0, 19, 1, 0, 0, 0,
        0, 21, 1, 0, 0, 0, 0, 23, 1, 0, 0, 0, 0, 25, 1, 0, 0, 0, 0, 27, 1, 0, 0,
        0, 0, 29, 1, 0, 0, 0, 0, 31, 1, 0, 0, 0, 0, 33, 1, 0, 0, 0, 0, 35, 1, 0,
        0, 0, 0, 37, 1, 0, 0, 0, 0, 39, 1, 0, 0, 0, 0, 41, 1, 0, 0, 0, 0, 43, 1,
        0, 0, 0, 1, 45, 1, 0, 0, 0, 3, 47, 1, 0, 0, 0, 5, 49, 1, 0, 0, 0, 7, 51,
        1, 0, 0, 0, 9, 53, 1, 0, 0, 0, 11, 55, 1, 0, 0, 0, 13, 58, 1, 0, 0, 0,
        15, 63, 1, 0, 0, 0, 17, 68, 1, 0, 0, 0, 19, 76, 1, 0, 0, 0, 21, 83, 1,
        0, 0, 0, 23, 98, 1, 0, 0, 0, 25, 100, 1, 0, 0, 0, 27, 102, 1, 0, 0, 0,
        29, 104, 1, 0, 0, 0, 31, 106, 1, 0, 0, 0, 33, 108, 1, 0, 0, 0, 35, 110,
        1, 0, 0, 0, 37, 112, 1, 0, 0, 0, 39, 130, 1, 0, 0, 0, 41, 132, 1, 0, 0,
        0, 43, 134, 1, 0, 0, 0, 45, 46, 5, 42, 0, 0, 46, 2, 1, 0, 0, 0, 47, 48,
        5, 47, 0, 0, 48, 4, 1, 0, 0, 0, 49, 50, 5, 37, 0, 0, 50, 6, 1, 0, 0, 0,
        51, 52, 5, 43, 0, 0, 52, 8, 1, 0, 0, 0, 53, 54, 5, 45, 0, 0, 54, 10, 1,
        0, 0, 0, 55, 56, 5, 105, 0, 0, 56, 57, 5, 102, 0, 0, 57, 12, 1, 0, 0, 0,
        58, 59, 5, 116, 0, 0, 59, 60, 5, 104, 0, 0, 60, 61, 5, 101, 0, 0, 61,
        62, 5, 110, 0, 0, 62, 14, 1, 0, 0, 0, 63, 64, 5, 101, 0, 0, 64, 65, 5,
        108, 0, 0, 65, 66, 5, 115, 0, 0, 66, 67, 5, 101, 0, 0, 67, 16, 1, 0, 0,
        0, 68, 72, 7, 0, 0, 0, 69, 71, 7, 1, 0, 0, 70, 69, 1, 0, 0, 0, 71, 74,
        1, 0, 0, 0, 72, 70, 1, 0, 0, 0, 72, 73, 1, 0, 0, 0, 73, 18, 1, 0, 0, 0,
        74, 72, 1, 0, 0, 0, 75, 77, 7, 2, 0, 0, 76, 75, 1, 0, 0, 0, 77, 78, 1,
        0, 0, 0, 78, 76, 1, 0, 0, 0, 78, 79, 1, 0, 0, 0, 79, 80, 1, 0, 0, 0, 80,
        81, 6, 9, 0, 0, 81, 20, 1, 0, 0, 0, 82, 84, 5, 45, 0, 0, 83, 82, 1, 0,
        0, 0, 83, 84, 1, 0, 0, 0, 84, 86, 1, 0, 0, 0, 85, 87, 7, 3, 0, 0, 86,
        85, 1, 0, 0, 0, 87, 88, 1, 0, 0, 0, 88, 86, 1, 0, 0, 0, 88, 89, 1, 0, 0,
        0, 89, 96, 1, 0, 0, 0, 90, 92, 5, 46, 0, 0, 91, 93, 7, 3, 0, 0, 92, 91,
        1, 0, 0, 0, 93, 94, 1, 0, 0, 0, 94, 92, 1, 0, 0, 0, 94, 95, 1, 0, 0, 0,
        95, 97, 1, 0, 0, 0, 96, 90, 1, 0, 0, 0, 96, 97, 1, 0, 0, 0, 97, 22, 1,
        0, 0, 0, 98, 99, 5, 44, 0, 0, 99, 24, 1, 0, 0, 0, 100, 101, 5, 40, 0, 0,
        101, 26, 1, 0, 0, 0, 102, 103, 5, 41, 0, 0, 103, 28, 1, 0, 0, 0, 104,
        105, 5, 61, 0, 0, 105, 30, 1, 0, 0, 0, 106, 107, 5, 62, 0, 0, 107, 32,
        1, 0, 0, 0, 108, 109, 5, 60, 0, 0, 109, 34, 1, 0, 0, 0, 110, 111, 5, 38,
        0, 0, 111, 36, 1, 0, 0, 0, 112, 113, 5, 124, 0, 0, 113, 38, 1, 0, 0, 0,
        114, 118, 5, 34, 0, 0, 115, 117, 8, 4, 0, 0, 116, 115, 1, 0, 0, 0, 117,
        120, 1, 0, 0, 0, 118, 116, 1, 0, 0, 0, 118, 119, 1, 0, 0, 0, 119, 121,
        1, 0, 0, 0, 120, 118, 1, 0, 0, 0, 121, 131, 5, 34, 0, 0, 122, 126, 5,
        39, 0, 0, 123, 125, 8, 5, 0, 0, 124, 123, 1, 0, 0, 0, 125, 128, 1, 0, 0,
        0, 126, 124, 1, 0, 0, 0, 126, 127, 1, 0, 0, 0, 127, 129, 1, 0, 0, 0,
        128, 126, 1, 0, 0, 0, 129, 131, 5, 39, 0, 0, 130, 114, 1, 0, 0, 0, 130,
        122, 1, 0, 0, 0, 131, 40, 1, 0, 0, 0, 132, 133, 5, 33, 0, 0, 133, 42, 1,
        0, 0, 0, 134, 135, 5, 10, 0, 0, 135, 44, 1, 0, 0, 0, 10, 0, 72, 78, 83,
        88, 94, 96, 118, 126, 130, 1, 6, 0, 0,
    ];

    private static __ATN: ATN;
    public static get _ATN(): ATN {
        if (!GrammarLexer.__ATN) {
            GrammarLexer.__ATN = new ATNDeserializer().deserialize(
                GrammarLexer._serializedATN
            );
        }

        return GrammarLexer.__ATN;
    }

    static DecisionsToDFA = GrammarLexer._ATN.decisionToState.map(
        (ds: DecisionState, index: number) => new DFA(ds, index)
    );
}
