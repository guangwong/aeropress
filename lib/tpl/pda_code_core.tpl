
var pda_table = <% print(JSON.stringify(table)) %>;

var pda_symbol_stack = [];
var pda_state_stack = [];

function pda_in(inpt){

    var symbol = inpt.symbol;
    var pda_state_cur = pda_state_stack[pda_state_stack.length-1];

    if(pda_table.action[pda_state_cur][symbol]){
        var action = pda_table.action[pda_state_cur][symbol];
        if(action.type === "shift"){
            pda_symbol_stack.push(inpt);
            pda_state_stack.push(action.value);
        }else if(action.type === "reduce" || action.type === "accept"){
            var popped = [];
            for(var i = 0, n = action.value; i < n; i++){
                pda_state_stack.pop();
                popped.push(pda_symbol_stack.pop());
            }
            popped.reverse();
            if(action.type === "accept"){
                pda_accept_callback(wrapSymbol(action.symbol, popped));
            }else{
                pda_in(wrapSymbol(action.symbol, popped));
                pda_in(inpt);
            }
        }else{
            throw new Erorr("未知的 action.type : " + action.type);
        }

    }else if(pda_table.goto[pda_state_cur][symbol]){
        var goto = pda_table.goto[pda_state_cur][symbol];
        pda_symbol_stack.push(inpt);
        pda_state_stack.push(goto.value);
    }else{
        throw new Error(pda_format_context(inpt));
    }

}

// 初始化狀態棧，並且輸入第一個符號
function pda_reset(){
    pda_state_stack.length = 0;
    pda_symbol_stack.length = 0;
    pda_state_stack.push(0);
}

function wrapSymbol(symbol, value){
    return {
        symbol : symbol,
        value : value
    }
}

function pda_format_context(inpt){
    return " input : " + inpt.symbol + "  pda_symbol_stack : [ " + pda_symbol_stack.map(function(n){return n.symbol}).join(" , ") + " ]"
        + "  " + "pda_state_stack : [ " + pda_state_stack.join(" , ") + " ] ";
}
