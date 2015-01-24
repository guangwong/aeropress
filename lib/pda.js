/**
 * 下推自動機，分為狀態棧和符號棧
*/

var _ = require("underscore");
var support = require("./support");
var CodeWraper = require("./code_wraper");
var TPL_CodeCore = support.tpl["pda_code_core"];

module.exports = PDA;
function PDA (config){
    var me = this;
    me._table = config.table;
}

PDA.prototype.genCodeCore = function(){
    var me = this;
    var opts = {
        table : me._table
    };
    return new CodeWraper( TPL_CodeCore(opts) );
}
