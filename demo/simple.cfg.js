// 语法规则
// G 符号为初态
exports.grammar = [
    {
        "symbol": "G",
        "rhs": [
            [ "statement"]
        ]
    },
    {
        "symbol": "statement",
        "rhs": [
            ["expression", "SEMICOLON"]
        ]
    },
    {
        "symbol": "expression",
        "rhs": [
            ["empty"],
            ["term"],
            ["ID", "EQ", "term"]
        ]
    },
    {
        "symbol": "term",
        "rhs": [
            ["term" , "OPERATOR", "term"],
            ["factor"]
        ]
    },
    {
        "symbol": "factor",
        "rhs": [
            ["NUMBER"],
            ["ID"],
            ["PARENTHESIS_OP", "expression", "PARENTHESIS_ED"]
        ]
    },
    {
        "symbol": "empty",
        "rhs": [
            [] // 作为 ε
        ]
    }
];

// 一些空白符号，先这样处理吧
exports.ignore = [
    {
        "symbol": "$ignore",
        "tokens": [
            ["BLANK"]
        ]
    }
];

// 词法规则
exports.lex = [
    {
        symbol: "BLANK",
        reg: /^\s+/
    },
    {
        symbol: "SEMICOLON",
        reg: /^;/
    },
    {
        symbol: "EQ",
        reg: /^=/
    },
    {
        symbol: "PARENTHESIS_OP",
        reg: /^\(/
    },
    {
        symbol: "PARENTHESIS_ED",
        reg: /^\)/
    },
    {
        symbol: "OPERATOR",
        reg: /^[+\-]/
    },
    {
        symbol: "ID",
        reg: /^\$(\w[\w\d]?)/,
        fn: function (regRet) {
            return regRet[1];
        }
    },
    {
        symbol: "NUMBER",
        reg: /^\d+/
    }
];