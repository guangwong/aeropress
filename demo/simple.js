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





