var Aeropress = require("../index");
var SimpleCFG = require("./simple.cfg");
var FS = require("fs");

var generatorOfTheSimple = new Aeropress.LR1({
    grammar : SimpleCFG.grammar,
    ignore : SimpleCFG.ignore,
    lex : SimpleCFG.lex
});

var itemSets = generatorOfTheSimple.getItemSets();
var table = generatorOfTheSimple.getTable();
var syntaxParserCodeCore = generatorOfTheSimple.genCodeCore();
syntaxParserCodeCore.code += FS.readFileSync(__dirname + "/simple.tail.js");
syntaxParserCodeCore.writeToFS(__dirname + "/simple_code_core.js");






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
