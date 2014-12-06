var _ = require("underscore");

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
            remoteItem.dotPosition === localItem.dotPosition
            && remoteItem.production === localItem.production
        );
    });
};

ItemSet.prototype.eq = function(remoteItemSet){
    var loccalItemSet = this;
    if(remoteItemSet.items.length !== loccalItemSet.items.length){
        return;
    }

    var n = 0;

    for (var idx = 0, len = remoteItemSet.items.length; idx < len; idx++) {
         if(loccalItemSet.has(remoteItemSet.items[idx])) {
             n++;
         }else{
             return false;
         }
    }
    if(n === len){
        return true;
    }

};

exports.Item = Item;
function Item(config){
    var me = this;
    _.extend(me, config);
}
Item.prototype.dotPosition = null;
Item.prototype.production = null;
