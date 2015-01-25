/**
 * 通用支持模塊
 */

var _ = require("underscore");
var FS = require("fs");

/**
 * 將所有 tpl/*.tpl 載入到 exports.tpl 中
 */
(function (tpl){
    var p = __dirname  + "/" + "tpl/";
    FS.readdirSync(p).filter(function(n){
        return /\.tpl$/.test(n);
    }).forEach(function(n){
        var nn = n.replace(/\.tpl$/,"");
        tpl[nn] = _.template(FS.readFileSync(p+n).toString());
    });
})(exports.tpl = {});

exports.conflict = function(reason){
    try{
        if(console.error){
            console.error(reason);
        }else if(console.log){
            console.log(reason);
        }
    }catch(err){
        //PASS
    }
}
