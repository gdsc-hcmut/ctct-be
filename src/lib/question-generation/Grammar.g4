grammar Grammar;

BOOLEAN: 'true' | 'false';
ID: [a-zA-Z_][a-zA-Z0-9_]*;
WS: [ \f\t\r\n]+ -> skip;
NUM: [0-9]+ ('.' [0-9]+)?;
COMMA: ',';
LPAREN: '(';
RPAREN: ')';
EQUAL: '=';
GREATER: '>';
LESS: '<';
AMPERSAND: '&';
PIPE: '|';
STRING: '"' (~["])* '"' | '\'' (~['])* '\'';
EXCLAM: '!';
NL: '\n';

ASTERISK: '*';
SLASH: '/';
PERCENT: '%';

PLUS: '+';
MINUS: '-';

prog: statement+;

statement: assignmentStatement NL*
    | ifStatement NL*
    | blockStatement NL*
    ;

assignmentStatement: ID EQUAL expr;

ifStatement: 'if' expr statement 'else' statement;

blockStatement: '{' statement* '}';

expr: LPAREN expr RPAREN                     # parenthesis
    | EXCLAM expr                            # logicalNot
    | (PLUS | MINUS) expr                    # unaryPlusMinus
    | expr (ASTERISK | SLASH | PERCENT) expr # multiplyDivideModulo
    | expr (PLUS | MINUS) expr               # addSubtract
    | expr (GREATER | LESS) EQUAL? expr      # nonEqualityComparison
    | expr (EXCLAM | EQUAL) EQUAL expr       # equalityComparison
    | expr AMPERSAND AMPERSAND expr          # conjunction
    | expr PIPE PIPE expr                    # disjunction
    | ID LPAREN (expr (COMMA expr)*)? RPAREN # functionCall
    | ID                                     # identifier
    | (BOOLEAN | STRING | NUM)               # literal
    ;

