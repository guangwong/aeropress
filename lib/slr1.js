var _ = require("underscore");
var SimpleLexer = require("./simple_lexer");
var ItemSupport = require("./item_support");
var ItemSet = ItemSupport.ItemSet;
var Item = ItemSupport.Item;

var SUPER_T_BEGIN = "$#";
var SUPER_T_END = "$$";
var SUPER_T_G = "$G";

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
    var itemSets; // 項集的集合
    var nullableSymbols;
    var firstOfNonterminals;
    var followOfNonterminals;

    // 最終的Table
    var table;

    me.getTable = function(){
        return table;
    }

    // 這些順序是有依賴關係的
    // 比如First要用到Nullable的表
    preProcessing(); // 预处理
    buildNullable();
    buildFirst();

    //buildFollow(); LR1 不需要這個

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
                "symbol": SUPER_T_G,
                "rhs": [
                    SUPER_T_BEGIN, grammar[0].symbol, SUPER_T_END
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
        terminals[SUPER_T_BEGIN] = SUPER_T_BEGIN; // 增加增广时用到的开端符号
        terminals[SUPER_T_END] = SUPER_T_END; // 增加增广时用到的終端符号
        symbols = _.extend({}, terminals, nonterminals); // 合并得到全部符号

    }

    /**
     * 每个非终结符的 First Set
     */
    function buildFirst(){
        firstOfNonterminals = {}; // 初始化一個表，First集合對於每個非終結符號
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

                        // 如果一個非終結符的 First 發生改變，就要再來一次，因為其他同學的 First 要依賴它來推導
                        if (terminals.hasOwnProperty(symbolAtDot)
                            && !firstSet.hasOwnProperty(symbolAtDot)) {
                                goOn = true;
                                firstSet[symbolAtDot] = symbolAtDot;
                        }

                        if(firstOfNonterminals.hasOwnProperty(symbolAtDot)){
                            for(firstSymbolOfNT in firstOfNonterminals[symbolAtDot]){
                                if(!firstSet.hasOwnProperty(firstSymbolOfNT)){
                                    goOn = true;
                                    firstSet[firstSymbolOfNT] = firstSymbolOfNT;
                                }
                            }
                        }

                        if (terminals.hasOwnProperty(symbolAtDot) // 如果是終結符號
                            ||  ( // 或者是不具有 nullable 性質的非終結符號
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
    }

    /**
     * SLR 的 Build Follow
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

        // 由底向上進行 Nullable 性質的推導
        // 比如 e : ε; c : e; N : e c;
        // 三者皆具 Nullable 性質
        // CFG 文法書寫時使用空數組描述 ε
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

        // 狀態0
        var initItemSet = new ItemSet({
            items : [
                new Item({
                    production : productions[0],
                    dotPosition : 0,
                    follows : [SUPER_T_END]
                })
            ]
        });
        itemSets = [ closure(initItemSet) ]; // closure 運算狀態0


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
                    table.action[itemSetIdx][terminal] =  "Shirt-" + findItemSetIdx(gotoResp);
                }
            }

            // 产出 reduce
            itemSet.items.forEach(function(item){
                if(item.production.rhs.length === item.dotPosition){
                    for(var terminal in followOfNonterminals[item.production.symbol]){
                        if(table.action[itemSetIdx][terminal]){
                            console.log("Reduce-"+item.production.rhs.length+" 冲突于", table.action[itemSetIdx][terminal])
                        }else{
                            table.action[itemSetIdx][terminal] =  "Reduce-"+item.production.rhs.length;
                        }
                    }
                }
            });

            table.goto[itemSetIdx] = {};
            for(var nonterminal in nonterminals){
                var gotoResp = goto(itemSet, terminal);
                if(gotoResp){
                    table.goto[itemSetIdx][nonterminal] =  "Jump" + findItemSetIdx(gotoResp);
                }else{
                    table.goto[itemSetIdx][nonterminal] =  "Error";
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

                    var follows = first(rhs.slice(dotPosition+1), item.follows);

                    productionOnDotsymbol.forEach(function(production){

                        var newItem =  new Item({
                            dotPosition : 0,
                            production : production,
                            follows : follows
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
            if(dotSymbol === symbol || newDotPosition === rhs.length){
                newItems.push(
                    new Item({
                        follows : item.follows,
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
    function first(rhs, transmitSet){
        var dot = 0;
        var ret = {};
        while(true){
            var symbolAtDot = rhs[dot];
            var firstSymbolOfNT;
            if(!symbolAtDot) {
                if(transmitSet){ // 至最後加入傳遞項，無論是是 Nullable 導致還是空 rhs 導致
                    _.extend(ret, transmitSet);
                }
                break;
            }

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









































