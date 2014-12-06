var Aeropress = require("../index");
var SimpleCFG = require("./simple.cfg");

var generatorOfTheSimple = new Aeropress.LR0({
    grammar : SimpleCFG.grammar,
    ignore : SimpleCFG.ignore,
    lex : SimpleCFG.lex
});

//var syntaxParserCodeCore = generatorOfTheSimple.genCodeCore();
//codeCore.writeToFS(__dirname + "/simple_core_code.js");





//var lexer = new Aeropress.SimpleLexer({
//    rules : [
//        {
//            symbol : "BLANK",
//            reg : /^\s+/
//        },
//        {
//            symbol : "ID",
//            reg    : /^\w[\w\d]?/
//            //, fn     : function(context, regRet){
//            //    return regRet[0];
//            //}
//        },
//        {
//            symbol : "AND",
//            reg    : /^&/
//        },
//        {
//            symbol : "NUMBER",
//            reg    : /^\d+/
//        }
//    ]
//});
//
//var codeCore = lexer.genCodeCore();
//var tail = 'lexer_in("x1 & 1233");';
//tail += 'console.log(lexer_out());';
//tail += 'console.log(lexer_out());';
//tail += 'console.log(lexer_out());';
//tail += 'console.log(lexer_out());';
//tail += 'console.log(lexer_out());';
//codeCore._code = codeCore._code + tail;
//codeCore.writeToFS(__dirname + "/lexer_core_code.js");
//
////var cfg = {};
////var lr1 = new LR1(cfg, lexer);
//
////console.log( lr1.genNodeJSModule().toString() );
////lr1.genNodeJSModule().writeTo("./simple_parser.js");
