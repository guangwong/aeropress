/**
 * LR1 語法解析器的生成器
 */

var _ = require("underscore");
var SimpleLexer = require("./simple_lexer");
var ItemSupport = require("./item_support");
var ItemSet = ItemSupport.ItemSet;
var Item = ItemSupport.Item;
var CodeWraper = require("./code_wraper");
var PDA = require("./pda");
var Support = require("./support");
var TplParserCodeCore = Support.tpl["parser_code_core"];

var SUPER_SYMBOL_END = "$$";
var SUPER_SYMBOL_G = "$G";

/**
 * @param config {grammar:{Grammar}, lex:{Lex}, ignore:{Ignore}}
 * @constructor
 */
module.exports = LR1;
LR1.prototype.config = null;
LR1.prototype.lexer = null;
LR1.prototype.pda = null;

function LR1(config){

    var me = this;

    var grammar = config.grammar;
    var lex = config.lex;
    var ignore = config.ignore;
    var lexer = me.lexer = new SimpleLexer({ rules : config.lex });

    var productions; // 增廣後的產生式集合
    var terminals; // 终结符
    var nonterminals; // 非终结符
    var symbols; // 全部的符号
    var itemSets; // 項集的集合
    var nullableSymbols; // 具有 Nullable 性質的符號集
    var firstOfNonterminals; // 每個非終結符的 First 集
    var table; // 最終的Table

    me.config = config;

    /**
     * 獲取產生的Table
     * @returns {Table}
     */
    me.getTable = function(){
        return table;
    }

    /**
     * 獲取項集集合
     * @returns {ItemSets}
     */
    me.getItemSets = function(){
        return itemSets;
    }

    // 這些順序是有依賴關係的，比如 First 要用到 Nullable 的表
    preProcessing();
    buildNullable();
    buildFirst();
    buildItemSets();
    buildTable();

    // 生成完 Table 後創建與之關聯的 PDA 類
    me.pda = new PDA({
        table : table
    });

    /**
     * 預處理
     * 1. 增廣、轉換產生式到易於處理的格式
     * 2. 得到全部符號、非中介符號、終結符號 三個表
     */
    function preProcessing(){

        // 增廣
        productions = [
            {
                "symbol": SUPER_SYMBOL_G,
                "rhs": [
                    grammar[0].symbol
                ]
            }
        ];

        // 轉換到平坦的組織方式
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
        terminals[SUPER_SYMBOL_END] = SUPER_SYMBOL_END; // 增加 $G 要用到的 Follow 符號
        symbols = _.extend({}, terminals, nonterminals); // 合併全部符號

    }

    /**
     * 構建 nullableSymbols 表
     * 每个非终结符的 Nullable 性质
     * 等于辨识出可能的 ε 转移
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
     * 構建 firstOfNonterminal 表
     * 得到每個非終結符的 First Set
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
     * 构建 itemSets 表
     */
    function buildItemSets(){

        var goOn = true;

        var initFollows = {};
        initFollows[SUPER_SYMBOL_END] = SUPER_SYMBOL_END; // 將終止符號作為 $G 的 Follow
        var initItemSet = new ItemSet({ // 此為狀態 0
            items : [
                new Item({
                    core : true,
                    production : productions[0],
                    dotPosition : 0,
                    follows : initFollows
                })
            ]
        });
        itemSets = [ closure(initItemSet) ]; // 同時初始化了 itemSets 表

        while(goOn){
            goOn = false;
            itemSets.forEach(function(itemSet, idxAtItemSets){
                for(var symbol in symbols){
                    var gotoResp = goto(itemSet, symbol); // 向該狀態輸入全部的符號，得到可能的轉移
                    if(gotoResp && !hasItemSet(gotoResp)){
                        gotoResp.from = idxAtItemSets + ":" + symbol; // 標記該狀態來源
                        itemSets.push(gotoResp);
                        itemSet.to = itemSet.to || [];
                        itemSet.to.push(symbol + ":" + itemSets.length - 1); // 標記所有可能的轉移出去
                        goOn = true;
                    }
                }
            });
        };

    }

    /**
     * 構建 table 表
     * buildTable 的核心思想是將項集集合作為狀態集合來看，構建之間的 PDA 狀態關係
     * 狀態關係分為 Action ( Shift 和 Reduce ) 和 GOTO ，Action 是項集內部轉換，GOTO 是狀態之間的跳躍
     */
    function buildTable(){

        table = {
            action : [],
            goto : []
        };

        itemSets.forEach(function(itemSet, itemSetIdx){

            var actionOfItemSet = table.action[itemSetIdx] = {};
            var gotoOfItemSet = table.goto[itemSetIdx] = {};

            for(var terminal in terminals){
                var gotoResp = goto(itemSet, terminal);
                if(gotoResp){
                    actionOfItemSet[terminal] = {
                        type : "shift",
                        value: findItemSetIdx(gotoResp)
                    }
                }
            }

            // 標記 Reduce 和 接受狀態
            itemSet.items.forEach(function(item){
                var followTerminal;
                var actionType = "reduce";
                if( item.production.rhs.length === item.dotPosition ){
                    if(item.production.symbol === SUPER_SYMBOL_G){
                        actionType = "accept";
                    }
                    for(followTerminal in item.follows){
                        var toSet = {
                            type    : actionType,
                            value   : item.production.rhs.length,
                            symbol  : item.production.symbol
                        }

                        if( actionOfItemSet[followTerminal] ){
                            Support.conflict(Error(
                                "衝突在狀態" + itemSetIdx + "，慾設定 "
                                    + followTerminal + " 為 " + toSet.type + ":" + toSet.value
                                    + " 但 " + actionOfItemSet[followTerminal].type + ":" + actionOfItemSet[followTerminal].value
                                    + " 早已存在。"
                            ));
                        }else{
                            actionOfItemSet[followTerminal] = toSet;
                        }
                    }
                }
            });

            for(var nonterminal in nonterminals){
                var gotoResp = goto(itemSet, nonterminal);
                if(gotoResp){
                    gotoOfItemSet[nonterminal] = {
                        type : "goto",
                        value: findItemSetIdx(gotoResp)
                    }
                }
            }

        });

    }

    /**
     * 對項集進行閉包運算
     * @param itemSet
     * @returns {itemSet}
     */
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

    /**
     * 計算狀態轉移
     * @param itemSet
     * @param symbol
     * @returns {itemSet|Null}
     */
    function goto(itemSet, symbol){

        var newItems = [];
        var items = itemSet.items;

        // 得出内核项
        items.forEach(function(item){
            var newDotPosition = item.dotPosition + 1;
            var production = item.production;
            var rhs = production.rhs;
            var dotSymbol = rhs[newDotPosition - 1];
            if(dotSymbol === symbol){
                newItems.push(
                    new Item({
                        core : true,
                        follows : item.follows,
                        production : production,
                        dotPosition : newDotPosition
                    })
                );
            }
        });

        if(newItems.length){ // 如果轉移到了內核項，就進行閉包運算，進行展開
            return closure(new ItemSet({
                items : newItems
            }));
        }else{
            return null;
        }

    }

    /**
     * 獲取一個 rhs 的 firstSet，處理了 ε （Nullable）
     * @param rhs
     * @param transmitSet 也許是 LR1 中需要進行傳遞的 Follows
     * @returns {firstSet}
     */
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

    /**
     * 查找一個 itemSet 在 itemSets 集合中的下標位置
     * @param remoteItemSet
     * @returns {number}
     */
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

    /**
     * itemSets 集合中是否有 itemSet
     * @param remoteItemSet
     * @returns {boolean}
     */
    function hasItemSet(remoteItemSet){
        return itemSets.some(function(localItemSet){
            return localItemSet.eq(remoteItemSet);
        });
    }

}

/**
 * 生成代碼
 * @returns {CodeWraper}
 */
LR1.prototype.genCodeCore = function(){
    var me = this;
    var codeCore = "";

    var lexerCodeCore = me.lexer.genCodeCore().toString();
    codeCore += lexerCodeCore;
    var pdaCodeCore = me.pda.genCodeCore().toString();
    codeCore += pdaCodeCore;
    var parserCodeCore = TplParserCodeCore();
    codeCore += parserCodeCore;

    return new CodeWraper( codeCore );
}

