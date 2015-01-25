/**
 * Code Wraper
 * 代碼包裹
 */
var FS = require("fs");

module.exports = CodeWrap;

/**
 * 代碼包裹類
 * @param code {String}
 * @constructor
 */
function CodeWrap(code){
    var self = this;
    self.code = code;
}

/**
 * 得到字符串類型的代碼
 * @returns {String}
 */
CodeWrap.prototype.toString = function(){
    var self = this;
    return self.code;
}

/**
 * 將代碼寫到磁盤
 * @param path 文件路徑
 */
CodeWrap.prototype.writeToFS = function(path){
    var self = this;
    FS.writeFileSync(path, self.code);
};
