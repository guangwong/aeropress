/***
 * 記錄之使用，無實際用途
 */
var followOfNonterminals; // SLR 使用的 Follow 計算
/**
 * SLR 的 Build Follow
 * Follow 合并的 Follow
 */
function buildFollow(){
    followOfNonterminals = {};
    var nonterminal;
    var goOn = true;
    var followSet;
    while (goOn){
        goOn = false;
        for(nonterminal in nonterminals){
            followSet = followOfNonterminals[nonterminal];
            if(!followSet){
                followOfNonterminals[nonterminal] = followSet = {};
            }
            productions.forEach(function (production) {
                var rhs = production.rhs;
                var dot;
                var symbolAtDot;
                var sym;
                var followSetOfProductionsSymbol;
                for (dot = 0, len = rhs.length; dot < len; dot++) {
                    symbolAtDot = rhs[dot];
                    if (symbolAtDot !== nonterminal) continue;

                    if (dot === len - 1) {// 在最后
                        if (followOfNonterminals.hasOwnProperty(production.symbol)) {
                            followSetOfProductionsSymbol = followOfNonterminals[production.symbol];
                            for (sym in followSetOfProductionsSymbol) {
                                if (!followSet.hasOwnProperty(sym)) {
                                    goOn = true;
                                    followSet[sym] = sym;
                                }
                            }
                        }
                    } else {
                        var firstRet = first(rhs.slice(dot+1));
                        for (sym in firstRet) {
                            if (!followSet.hasOwnProperty(sym)) {
                                goOn = true;
                                followSet[sym] = sym;
                            }
                        }
                    }

                }

            });
        }
    }
}
