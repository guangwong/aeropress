var _ = require("underscore");
var SimpleLexer = require("./simple_lexer");
var ItemSupport = require("./item_support");
var ItemSet = ItemSupport.ItemSet;
var Item = ItemSupport.Item;

module.exports = LR0;
function LR0(config){

    var me = this;
    var config = me.config = config;
    var grammar = config.grammar;
    var lex = config.lex;
    var ignore = config.ignore;
    var lexer = me.lexer = new SimpleLexer({ rules : config.lex });

    var productions; // 增广后的项集
    var terminals; // 终结符
    var nonterminals; // 非终结符
    var symbols; // 全部的符号
    var itemSets; // 项目们
    var table;

    preProcessing(); // 预处理
    //buildNullable();
    //buildFirst();
    //buildFollow();
    buildItemSets();
    //buildTable();

    /**
     * 1. 增广、转换项集到易于处理的格式
     * 2. 得到全部符号表、非终结符表、终结符表
     */
    function preProcessing(){

        // 增广
        productions = [
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
                productions.push(p);
            });
        });


        // 得到 nonterminals terminals and symbols
        nonterminals = {};
        productions.forEach(function(p){
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
     //closure(productions[0], 0)
    function buildItemSets(){
        var goOn = true;
        var initItemSet = new ItemSet({
            items : [
                new Item({
                    production : productions[0],
                    dotPosition : 0
                })
            ]
        });
        itemSets = [ closure(initItemSet) ]; // 设定初态

        while(goOn){
            goOn = false;
            itemSets.forEach(function(itemSet, idxAtItemSets){
                for(var symbol in symbols){ // 向该状态输入各色符号
                    var gotoResp = goto(itemSet, symbol);
                    if(gotoResp && !hasItemSet(gotoResp)){
                        itemSets.push(gotoResp);
                        goOn = true;
                    }
                }
            });
        }
        console.log(
            JSON.stringify(itemSets, null, 2)
        )

        //for(var symbol in symbols){
        //    itemSets.forEach(function(item, itemIdx){
        //        goto(item, itemIdx);
        //    });
        //}
    }

    function closure(itemSet){
        var goOn = true;
        var items = itemSet.items;

        while(goOn){
            goOn = false;
            items.forEach(function(item, itemIdx){
                var dotPosition = item.dotPosition;
                var production = item.production;
                var rhs = production.rhs;
                var dotSymbol = rhs[dotPosition];

                var productionOnDotsymbol = nonterminals[dotSymbol];
                if(productionOnDotsymbol){

                    productionOnDotsymbol.forEach(function(production){
                        var newItem =  new Item({
                            dotPosition : 0,
                            production : production
                        });
                        if(!itemSet.has(newItem)){
                            goOn = true;
                            items.push(newItem);
                        }

                    });
                }

            });

        }
        return itemSet;
    }

    function goto(itemSet, symbol){

        var newItems = [];
        var items = itemSet.items;

        // 得出内核项
        items.forEach(function(item){

            var newDotPosition = item.dotPosition + 1;
            var production = item.production;
            var rhs = production.rhs;
            var dotSymbol = rhs[newDotPosition];
            if(dotSymbol === symbol){
                newItems.push(
                    new Item({
                        production : production,
                        dotPosition : newDotPosition
                    })
                )
            }

        });

        if(newItems.length){ // 如果里面有玩意
            return closure(new ItemSet({
                items : newItems
            }));
        }else{
            return null;
        }

    }


    function hasItemSet(findItemSetIdx){
        var idx = -1;
        return itemSets.some(function(localItemSet, idx){
            idx = idx;
        });
        return idx;
    }

    function hasItemSet(remoteItemSet){
        return itemSets.some(function(localItemSet){
            return localItemSet.eq(remoteItemSet);
        });
    }

}









































