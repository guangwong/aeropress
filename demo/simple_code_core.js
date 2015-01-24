
var rules = [{"symbol":"BLANK", "reg":/^\s+/, "fn":null},{"symbol":"SEMICOLON", "reg":/^;/, "fn":null},{"symbol":"EQ", "reg":/^=/, "fn":null},{"symbol":"PARENTHESIS_OP", "reg":/^\(/, "fn":null},{"symbol":"PARENTHESIS_ED", "reg":/^\)/, "fn":null},{"symbol":"OPERATOR", "reg":/^[+\-]/, "fn":null},{"symbol":"ID", "reg":/^\$(\w[\w\d]?)/, "fn":function (regRet) {
            return regRet[1];
        }},{"symbol":"NUMBER", "reg":/^\d+/, "fn":null}];

var lexer_buffer;
var lexer_context;
var lexer_out_buffer; // 为了可以 peek 多个符号而设计

function lexer_in(str){
    lexer_buffer = lexer_buffer + str;
}

function lexer_reset(){

    lexer_out_buffer = [];
    lexer_context = {
        pos : 0,
        ln : 0,
        lnPos : 0
    };
    lexer_buffer = "";
}

function lexer_out(){ // 输出一个符号
    if(lexer_context.pos >= lexer_buffer.length){
        return null;
    }
    var tok;
    if(lexer_out_buffer.length){
        tok = lexer_out_buffer.shift();
    }else{
        tok = lexer_match();
    }

    if(!tok){
        throw (new Error("未知符号在位置：" + lexer_format_context() ));
    }

    tok.pos = lexer_context.pos;
    tok.ln = lexer_context.ln;
    lexer_context.pos += tok.posInc;
    lexer_context.ln += tok.lnInc;
    if(lexer_context.lnInc){ // When new line.
        lexer_context.lnPos = 0;
    }
    lexer_context.lnPos += tok.lnPosInc;

    return tok;

}

function lexer_peek(){ // 向前偷看1个符号

    var tok;

    if(lexer_out_buffer.length){
        tok = lexer_out_buffer.shift();
    }else{
        tok = lexer_match();
    }

    if(!tok){
        throw (new Error("未知符号在位置：", + lexer_format_context() ));
    }

    return tok;

}

function lexer_match(){ // Match 一个 tok

    var curText = lexer_buffer.substring(lexer_context.pos);
    var tokMatched = null;

    for(var idx = 0, len = rules.length; idx < len; idx++){
        var rule = rules[idx];
        var regRet  = rule.reg.exec(curText);  // 长的优先，同长度后定义的优先
        if( regRet && ( !tokMatched || regRet[0].length >= tokMatched.length ) ){
            if(!tokMatched) tokMatched = {};
            tokMatched.regRet = regRet;
            tokMatched.rule = rule;
            tokMatched.posInc = regRet[0].length;
            tokMatched.symbol = rule.symbol;
        }
    }

    return tokMatched;
}

function lexer_format_context(){
    return "TODO:implement it";
}


var SUPER_T_BEGIN = "$#";
var SUPER_T_END = "$$";
var SUPER_T_G = "$G";

var pda_table = {"action":[{"PARENTHESIS_OP":{"type":"shift","value":1},"ID":{"type":"shift","value":2},"NUMBER":{"type":"shift","value":3},"SEMICOLON":{"type":"reduce","value":0,"symbol":"empty"}},{"PARENTHESIS_OP":{"type":"shift","value":10},"ID":{"type":"shift","value":11},"NUMBER":{"type":"shift","value":12},"PARENTHESIS_ED":{"type":"reduce","value":0,"symbol":"empty"}},{"EQ":{"type":"shift","value":17},"SEMICOLON":{"type":"reduce","value":1,"symbol":"factor"},"OPERATOR":{"type":"reduce","value":1,"symbol":"factor"}},{"SEMICOLON":{"type":"reduce","value":1,"symbol":"factor"},"OPERATOR":{"type":"reduce","value":1,"symbol":"factor"}},{"$$":{"type":"accept","value":1,"symbol":"$G"}},{"$$":{"type":"reduce","value":1,"symbol":"G"}},{"SEMICOLON":{"type":"shift","value":18}},{"OPERATOR":{"type":"shift","value":19},"SEMICOLON":{"type":"reduce","value":1,"symbol":"expression"}},{"SEMICOLON":{"type":"reduce","value":1,"symbol":"term"},"OPERATOR":{"type":"reduce","value":1,"symbol":"term"}},{"SEMICOLON":{"type":"reduce","value":1,"symbol":"expression"}},{"PARENTHESIS_OP":{"type":"shift","value":10},"ID":{"type":"shift","value":11},"NUMBER":{"type":"shift","value":12},"PARENTHESIS_ED":{"type":"reduce","value":0,"symbol":"empty"}},{"EQ":{"type":"shift","value":21},"PARENTHESIS_ED":{"type":"reduce","value":1,"symbol":"factor"},"OPERATOR":{"type":"reduce","value":1,"symbol":"factor"}},{"PARENTHESIS_ED":{"type":"reduce","value":1,"symbol":"factor"},"OPERATOR":{"type":"reduce","value":1,"symbol":"factor"}},{"PARENTHESIS_ED":{"type":"shift","value":22}},{"OPERATOR":{"type":"shift","value":23},"PARENTHESIS_ED":{"type":"reduce","value":1,"symbol":"expression"}},{"PARENTHESIS_ED":{"type":"reduce","value":1,"symbol":"term"},"OPERATOR":{"type":"reduce","value":1,"symbol":"term"}},{"PARENTHESIS_ED":{"type":"reduce","value":1,"symbol":"expression"}},{"PARENTHESIS_OP":{"type":"shift","value":1},"ID":{"type":"shift","value":24},"NUMBER":{"type":"shift","value":3}},{"$$":{"type":"reduce","value":2,"symbol":"statement"}},{"PARENTHESIS_OP":{"type":"shift","value":1},"ID":{"type":"shift","value":24},"NUMBER":{"type":"shift","value":3}},{"PARENTHESIS_ED":{"type":"shift","value":27}},{"PARENTHESIS_OP":{"type":"shift","value":10},"ID":{"type":"shift","value":28},"NUMBER":{"type":"shift","value":12}},{"SEMICOLON":{"type":"reduce","value":3,"symbol":"factor"},"OPERATOR":{"type":"reduce","value":3,"symbol":"factor"}},{"PARENTHESIS_OP":{"type":"shift","value":10},"ID":{"type":"shift","value":28},"NUMBER":{"type":"shift","value":12}},{"SEMICOLON":{"type":"reduce","value":1,"symbol":"factor"},"OPERATOR":{"type":"reduce","value":1,"symbol":"factor"}},{"OPERATOR":{"type":"shift","value":19},"SEMICOLON":{"type":"reduce","value":3,"symbol":"expression"}},{"OPERATOR":{"type":"shift","value":19},"SEMICOLON":{"type":"reduce","value":3,"symbol":"term"}},{"PARENTHESIS_ED":{"type":"reduce","value":3,"symbol":"factor"},"OPERATOR":{"type":"reduce","value":3,"symbol":"factor"}},{"PARENTHESIS_ED":{"type":"reduce","value":1,"symbol":"factor"},"OPERATOR":{"type":"reduce","value":1,"symbol":"factor"}},{"OPERATOR":{"type":"shift","value":23},"PARENTHESIS_ED":{"type":"reduce","value":3,"symbol":"expression"}},{"OPERATOR":{"type":"shift","value":23},"PARENTHESIS_ED":{"type":"reduce","value":3,"symbol":"term"}}],"goto":[{"G":{"type":"goto","value":4},"statement":{"type":"goto","value":5},"expression":{"type":"goto","value":6},"term":{"type":"goto","value":7},"factor":{"type":"goto","value":8},"empty":{"type":"goto","value":9}},{"expression":{"type":"goto","value":13},"term":{"type":"goto","value":14},"factor":{"type":"goto","value":15},"empty":{"type":"goto","value":16}},{},{},{},{},{},{},{},{},{"expression":{"type":"goto","value":20},"term":{"type":"goto","value":14},"factor":{"type":"goto","value":15},"empty":{"type":"goto","value":16}},{},{},{},{},{},{},{"term":{"type":"goto","value":25},"factor":{"type":"goto","value":8}},{},{"term":{"type":"goto","value":26},"factor":{"type":"goto","value":8}},{},{"term":{"type":"goto","value":29},"factor":{"type":"goto","value":15}},{},{"term":{"type":"goto","value":30},"factor":{"type":"goto","value":15}},{},{},{},{},{},{},{}]}
var pda_symbol_stack = [];
var pda_state_stack = [];

// 向pda輸入一個符號
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
        throw new Error(pda_format_context());
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

function pda_format_context(){
    return "TODO:implement it";
}
var parser_accept_callback_result;
function parser_reset(){
    parser_accept_callback_result = null;
    lexer_reset();
    pda_reset();
}

function parser_parse(code){
    parser_reset();
    lexer_in(code);
    var tok;
    while(tok = lexer_out()){
        pda_in(wrapSymbol(tok.symbol, tok));
    }
    pda_in(wrapSymbol(SUPER_T_END));
    if(!parser_accept_callback_result){
        throw new Error("不能停機");
    }
    return parser_accept_callback_result;
}

function pda_accept_callback(result){
    parser_accept_callback_result = result;
}


var result = parser_parse("$a=$c+(1-2)-$d;");
//debugger;
console.log(JSON.stringify(result,null,2));

