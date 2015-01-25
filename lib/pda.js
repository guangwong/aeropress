/**
 * PDA
 * 下推自動機的代碼生成
 */
var _ = require("underscore");
var Support = require("./support");
var CodeWraper = require("./code_wraper");
var tplPDACodeCore = Support.tpl["pda_code_core"];

module.exports = PDA;

/**
 * @param config {table:狀態轉移表}
 * @constructor
 */
function PDA (config){
    var me = this;
    me._table = config.table;
}

/**
 * 生成代碼
 * @returns {CodeWraper}
 */
PDA.prototype.genCodeCore = function(){
    var me = this;
    var opts = {
        table : me._table
    };
    return new CodeWraper( tplPDACodeCore(opts) );
}
