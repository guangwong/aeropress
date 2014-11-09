// 被生成的代码的wraper

var FS = require("fs");
module.exports = CodeWrap;
function CodeWrap(code){
    var self = this;
    self._code = code;
}

CodeWrap.prototype.toString = function(){
    var self = this;
    return self._code;
}

CodeWrap.prototype.writeToFS = function(path){
    var self = this;
    FS.writeFileSync(path, self._code);
};
