var _ = require("underscore");
var FS = require("fs");

(function (tpl){
    var p = __dirname  + "/" + "tpl/";
    FS.readdirSync(p).filter(function(n){
        return /\.tpl$/.test(n);
    }).forEach(function(n){
        var nn = n.replace(/\.tpl$/,"");
        tpl[nn] = _.template(FS.readFileSync(p+n).toString());
    });
})(exports.tpl = {});


