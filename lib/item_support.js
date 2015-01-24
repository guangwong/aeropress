/***
 * 項、項集等 Class
 */
var _ = require("underscore");

// 項集
exports.ItemSet = ItemSet;
function ItemSet(config){
    var me = this;
    _.extend(me, config);
}
ItemSet.prototype.items = null;
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

// 項
exports.Item = Item;
function Item(config){
    var me = this;
    _.extend(me, config);
}
Item.prototype.follows = []; // 當SLR時不需要這箇東西，Shim一個在原型上
Item.prototype.dotPosition = null;
Item.prototype.production = null;

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
