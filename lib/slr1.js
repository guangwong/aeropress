var _ = require("underscore");
var SimpleLexer = require("./simple_lexer");
var ItemSupport = require("./item_support");
var ItemSet = ItemSupport.ItemSet;
var Item = ItemSupport.Item;

module.exports = SLR1;
function SLR1(config){

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
    var nullableSymbols;
    var firstOfNonterminals;
    var followOfNonterminals;
    var table;

    preProcessing(); // 预处理
    buildNullable();
    buildFirst(); //firstSetOfEachSymbol
    buildFollow(); //followSetOfEachSymbol
    //buildItemSets();
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
     * 每个非终结符的 First Set
     */
    function buildFirst(){
        firstOfNonterminals = {};
        var goOn = true;
        while(goOn){
            goOn = false;
            var nonterminal;
            var productionsOfNonterminal;
            var firstSet;
            for(nonterminal in nonterminals){
                productionsOfNonterminal = nonterminals[nonterminal];
                firstSet = firstOfNonterminals[nonterminal];
                if(!firstSet){
                    firstSet = firstOfNonterminals[nonterminal] = {};
                }
                productionsOfNonterminal.forEach(function(production){
                    var rhs = production.rhs;
                    var dot = 0;
                    var symbolAtDot;
                    var firstSymbolOfNT;
                    while(true){
                        symbolAtDot = rhs[dot];
                        if(!symbolAtDot) break;


                        if(terminals.hasOwnProperty(symbolAtDot)){
                            if(!firstSet.hasOwnProperty(symbolAtDot)){
                                goOn = true;
                                firstSet[symbolAtDot] = symbolAtDot;
                            }
                        }
                        if(firstOfNonterminals.hasOwnProperty(symbolAtDot)){
                            for(firstSymbolOfNT in firstOfNonterminals[symbolAtDot]){
                                if(!firstSet.hasOwnProperty(firstSymbolOfNT)){
                                    goOn = true;
                                    firstSet[firstSymbolOfNT] = firstSymbolOfNT;
                                }
                            }
                        }

                        if (terminals.hasOwnProperty(symbolAtDot)
                            ||  (
                                    nonterminals.hasOwnProperty(symbolAtDot)
                                    && !nullableSymbols.hasOwnProperty(symbolAtDot)
                                )
                        )
                            break;
                        dot++;
                    }
                });
            }
        }
        //console.log(firstOfNonterminals)
    }

    /**
     * Follow 合并的 Follow
     */
    function buildFollow(){
        followOfNonterminals = {};
        var nonterminal;
        var goOn = true;
        var followSet;
        while (goOn){
            goOn = false;
            for(nonterminal in nonterminals){
                followSet = followOfNonterminals[nonterminal];
                if(!followSet){
                    followOfNonterminals[nonterminal] = followSet = {};
                }
                productions.forEach(function (production) {
                    var rhs = production.rhs;
                    var dot;
                    var symbolAtDot;
                    var sym;
                    var followSetOfProductionsSymbol;
                    for (dot = 0, len = rhs.length; dot < len; dot++) {
                        symbolAtDot = rhs[dot];
                        if (symbolAtDot !== nonterminal) continue;

                        if (dot === len - 1) {// 在最后
                            if (followOfNonterminals.hasOwnProperty(production.symbol)) {
                                followSetOfProductionsSymbol = followOfNonterminals[production.symbol];
                                for (sym in followSetOfProductionsSymbol) {
                                    if (!followSet.hasOwnProperty(sym)) {
                                        goOn = true;
                                        followSet[sym] = sym;
                                    }
                                }
                            }
                        } else {
                            var firstRet = first(rhs.slice(dot+1));
                            for (sym in firstRet) {
                                if (!followSet.hasOwnProperty(sym)) {
                                    goOn = true;
                                    followSet[sym] = sym;
                                }
                            }
                        }

                    }

                });
            }
        }
    }

    /**
     * 每个非终结符的 Nullable 性质
     * 等于辨识出可能的 ε 转移
     * 可以再构建一个 HashTable 来存储
     */
    function buildNullable(){
        nullableSymbols = {};

        // 由底向上进行该性质的聚集
        // 比如 e -> ε; c -> e; N -> e c;
        // 三者皆为 nullable 性质
        // 文法中描述 ε 使用空数组即可
        var goOn = true;
        var nonterminal;
        var productions;
        while(goOn){
            goOn = false;
            for(nonterminal in nonterminals){
                if(nullableSymbols.hasOwnProperty(nonterminal)){
                    continue;
                }
                productions = nonterminals[nonterminal];
                productions.forEach(function(production){
                    var rhsLength = production.rhs.length;
                    var nullableSymbolsCountOfProduction;
                    if(rhsLength === 0){ // [] as [ ε ]
                        goOn = true;
                        nullableSymbols[nonterminal] = nonterminal;
                        return;
                    }
                    nullableSymbolsCountOfProduction = 0;
                    production.rhs.forEach(function(symbol){
                        if(nullableSymbols.hasOwnProperty(symbol)){
                            nullableSymbolsCountOfProduction++;
                        }
                    });
                    if(nullableSymbolsCountOfProduction === rhsLength){
                        goOn = true;
                        nullableSymbols[nonterminal] = nonterminal;
                    }
                });
            }

        }

    }

    /**
     * 构建 Items
     */
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
        };

        //for(var symbol in symbols){
        //    itemSets.forEach(function(item, itemIdx){
        //        goto(item, itemIdx);
        //    });
        //}
    }

    // 未完成
    function buildTable(){
        table = {
            action : [],
            goto : []
        };

        itemSets.forEach(function(itemSet, itemSetIdx){

            table.action[itemSetIdx] = {};
            for(var terminal in terminals){
                var gotoResp = goto(itemSet, terminal);

                if(gotoResp){
                    table.action[itemSetIdx][terminal] =  findItemSetIdx(gotoResp);
                }else{
                    table.action[itemSetIdx][terminal] =  "未知";
                }
            }

            table.goto[itemSetIdx] = {};
            for(var nonterminal in nonterminals){
                var gotoResp = goto(itemSet, terminal);
                if(gotoResp){
                    table.goto[itemSetIdx][nonterminal] =  findItemSetIdx(gotoResp);
                }else{
                    table.goto[itemSetIdx][nonterminal] =  "未知";
                }

            }

        });


    }

    // helpers

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

    function findItemSetIdx(remoteItemSet){
        var idx = -1;
        itemSets.some(function(localItemSet, _idx){
            if(localItemSet.eq(remoteItemSet)){
                idx = _idx;
                return true;
            }
        });
        return idx;
    }

    function hasItemSet(remoteItemSet){
        return itemSets.some(function(localItemSet){
            return localItemSet.eq(remoteItemSet);
        });
    }

    // 带 ε 处理的 first 获取
    // 返回非终结符数组
    function first(rhs){
        var dot = 0;
        var ret = {};
        while(true){
            var symbolAtDot = rhs[dot];
            var firstSymbolOfNT;
            if(!symbolAtDot) break;

            if(terminals.hasOwnProperty(symbolAtDot)){
                ret[symbolAtDot] = symbolAtDot;
            }

            if(firstOfNonterminals.hasOwnProperty(symbolAtDot)){
                for(firstSymbolOfNT in firstOfNonterminals[symbolAtDot]){
                    ret[firstSymbolOfNT] = firstSymbolOfNT;
                }
            }

            if(
                terminals.hasOwnProperty(symbolAtDot)
                || (
                        nonterminals.hasOwnProperty(symbolAtDot)
                        && !nullableSymbols.hasOwnProperty(symbolAtDot)
                   )
                ) break;

            dot++;
        }
        return ret;

    }

}

function PDA(){

}









































