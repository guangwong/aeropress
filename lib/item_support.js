/***
 * 項集相關的支持模塊
 */
var _ = require("underscore");

/**
 * 項目集類
 * @param config {items:項集合}
 * @constructor
 */
exports.ItemSet = ItemSet;
ItemSet.prototype.items = null;
function ItemSet(config){
    var me = this;
    _.extend(me, config);
}

/**
 * 本項集是否含有輸入的項
 * @param remoteItem
 * @returns {boolean}
 */
ItemSet.prototype.has = function(remoteItem){
    var me = this;
    var items = me.items;
    return items.some(function(localItem){
        return (
            objEq(remoteItem.follows, localItem.follows)
            && remoteItem.dotPosition === localItem.dotPosition
            && remoteItem.production === localItem.production
        );
    });
};

/**
 * 本項集是否等價於輸入的項
 * @param remoteItemSet
 * @returns {boolean}
 */
ItemSet.prototype.eq = function(remoteItemSet){
    var localItemSet = this;
    if(remoteItemSet.items.length !== localItemSet.items.length){
        return;
    }
    var n = 0;
    for (var idx = 0, len = remoteItemSet.items.length; idx < len; idx++) {
         if(localItemSet.has(remoteItemSet.items[idx])) {
             n++;
         }else{
             return false;
         }
    }
    if(n === len){
        return true;
    }

};

/**
 * 單個項目
 * @param config {follows:{Array|undef}, dotPosition:Number, production:{Production}}
 * @constructor
 */
exports.Item = Item;
Item.prototype.follows = []; // 當SLR時不需要這箇東西，Shim一個在原型上
Item.prototype.dotPosition = null;
Item.prototype.production = null;
Item.prototype.core = false; // 是否為內核項
function Item(config){
    var me = this;
    _.extend(me, config);
}


/**
 * 兩個對象是等價
 * @param a
 * @param b
 * @returns {boolean}
 */
function objEq(a,b){
    for(var key in a){
        if(b[key] !== a[key]){
            return false;
        }
    }
    for(var key in b){
        if(a[key] !== b[key]){
            return false;
        }
    }
    return true;
}
