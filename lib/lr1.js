var SimpleLexer = require("./simple_lexer");
var _ = require("underscore");

module.exports = LR1;
function LR1(config){

    var me = this;
    var config = me.config = config;
    var grammar = config.grammar;
    var lex = config.lex;
    var ignore = config.ignore;
    var lexer = me.lexer = new SimpleLexer({ rules : config.lex });

    var products; // 增广后的项集
    var terminals; // 终结符
    var nonterminals; // 非终结符
    var symbols; // 全部的符号
    var items; // 项目们
    var table;

    preProcessing(); // 预处理
    buildNullable();
    buildFirst();
    buildFollow();
    buildItems();
    buildTable();

    /**
     * 1. 增广、转换项集到易于处理的格式
     * 2. 得到全部符号表、非终结符表、终结符表
     */
    function preProcessing(){

        // 增广
        products = [
            {
                "symbol": "$G",
                "rhs": [
                    "$#", grammar[0].symbol, "$$"
                ]
            }
        ];

        // 转换项集到易于处理的格式
        grammar.forEach(function(n){
            n.rhs.forEach(function(rhs){
                var p = _.clone(n);
                p.rhs = rhs;
                products.push(p);
            });
        });


        // 得到 nonterminals terminals and symbols
        nonterminals = {};
        products.forEach(function(p){
            nonterminals[p.symbol] = nonterminals[p.symbol] || [];
            nonterminals[p.symbol].push(p);
        });
        terminals = lexer.getSymbols();
        terminals["$#"] = "$#"; // 增加增广时用到的开端符号
        terminals["$$"] = "$$"; // 增加增广时用到的收场符号
        symbols = _.extend({}, terminals, nonterminals); // 合并得到全部符号

    }

    /**
     * 构建 Items
     */
    function buildItems(){
        items = [ closure(products[0], 0) ]; // 设定初态
        for(var symbol in symbols){
            items.forEach(function(item, itemIdx){
                goto(item, itemIdx);
            });
        }
    }


    function closure(){

    }

    function goto(){

    }

}










































