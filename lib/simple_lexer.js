/**
 * Simple Lexer
 * Lexer 代碼生成
 */
var _ = require("underscore");
var Support = require("./support");
var CodeWraper = require("./code_wraper");
var tplSimpleLexerCodeCore = Support.tpl["simple_lexer_code_core"];

module.exports = SimpleLexer;

/**
 * @param config {rule:詞法規則}
 * @constructor
 */
function SimpleLexer (config){
    var me = this;
    me._rules = config.rules;
    me._symbols = null;
    me._symbolMapss = null;
    me.buildTokens();
}

/**
 * 產生規則符號表
 */
SimpleLexer.prototype.buildTokens = function(){
    var me = this;
    var symUniMap = {};
    me._rules.forEach(function(n){
        symUniMap[n.symbol] = n.symbol;
    });
    me._symbols = symUniMap;
}

/**
 * 獲取原始符號表
 * @returns {null|*}
 */
SimpleLexer.prototype.getSymbols = function(){
    var me = this;
    return me._symbols;
}

/**
 * 設置符號映射表
 * @param symbolMaps
 */
SimpleLexer.prototype.setSymbolMap = function(symbolMaps){
    var me = this;
    me._symbolMapss = symbolMaps;
}

/**
 * 生成符號化的規則，意為進行了符號映射處理的 Lex 規則表
 * @returns {*}
 */
SimpleLexer.prototype.genRulesSymbolization = function(){
    var me = this;
    var symbolMaps = me._symbolMapss;
    if(!symbolMaps) return me._rules;
    return me._rules.map(function(n){
        var nClone = _.clone(n);
        nClone.symbol = symbolMaps[n.symbol] || n.symbol;
        return  nClone;
    });
}

/**
 * 生成代碼
 * @returns {CodeWraper}
 */
SimpleLexer.prototype.genCodeCore = function(){
    var me = this;
    var opts = {
        rules : me.genRulesSymbolization()
    };
    return new CodeWraper( tplSimpleLexerCodeCore(opts) );
}
