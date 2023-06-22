grammar Grammar;

ID: [a-zA-Z_][a-zA-Z0-9_]*;
WS: [ \t\r\n]+ -> skip;
NUM: '-'? [0-9]+ ('.' [0-9]+)?;
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

prog: statement+;

statement: expr NL*;

expr: LPAREN expr RPAREN                     # parenthesis
    | EXCLAM expr                            # logicalNot
    | expr '*' expr                          # multilpy
    | expr '/' expr                          # division
    | expr '%' expr                          # modulo
    | expr '+' expr                          # addition
    | expr '-' expr                          # subtraction
    | expr EQUAL EQUAL expr                  # equalComparison
    | expr EXCLAM EQUAL expr                 # notEqualComparison
    | expr GREATER EQUAL? expr               # greaterComparison
    | expr LESS EQUAL? expr                  # lessComparison
    | expr AMPERSAND AMPERSAND expr          # conjunction
    | expr PIPE PIPE expr                    # disjunction
    | ID EQUAL expr                          # assignment
    | 'if' expr 'then' expr 'else' expr      # ifExpression
    | ID LPAREN (expr (COMMA expr)*)? RPAREN # functionCall
    | STRING                                 # stringValue
    | ID                                     # identifier
    | NUM                                    # numberValue
    ;

