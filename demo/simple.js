var lexerRules = [];
var lexer = new SimpleLexer({
    rules : lexerRules
});

var cfg = {};
var lr1 = new LR1(cfg, lexer);

lr1.genNodeJSModule().toString();
lr1.genNodeJSModule().writeTo("./simple_parser.js");
