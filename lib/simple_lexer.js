var _ = require("underscore");
var support = require("./support");
var CodeWraper = require("./code_wraper");
var TPL_CodeCore = support.tpl["simple_lexer_code_core"];

module.exports = SimpleLexer;
function SimpleLexer (config){
    var self = this;
    self._rules = config.rules;
    self._symbols = null;
    self._symbolMap = null;
    self.buildTokens();
}

SimpleLexer.prototype.buildTokens = function(){
    var self = this;
    var symUniMap = {};
    var symList = [];
    self._rules.forEach(function(n){
        symUniMap[n.symbol] = 1;
    });
    for(var s in symUniMap){
        symList.push(s);
    }
    self._symbols = symList;
}

SimpleLexer.prototype.getSymbols = function(){
    var self = this;
    return self._symbols;
}

SimpleLexer.prototype.setSymbolMap = function(symbolMap){
    var self = this;
    self._symbolMap = symbolMap;
}

SimpleLexer.prototype.genRulesSymbolization = function(){
    var self = this;
    var symbolMap = self._symbolMap;
    if(!symbolMap) return self._rules;
    return self._rules.map(function(n){
        var nClone = _.clone(n);
        nClone.symbol = symbolMap[n.symbol] || n.symbol;
        return  nClone;
    });
}

SimpleLexer.prototype.genCodeCore = function(){
    var self = this;
    var opts = {
        rules : self.genRulesSymbolization()
    };
    return new CodeWraper( TPL_CodeCore(opts) );
}
