var rules = [<% print(rules.map(function(n){
        return  '{' + [
            '"symbol":"' + n.symbol + '"',
            '"reg":' + n.reg.toString(),
            '"fn":' + (n.fn ? n.fn.toString() : null),
        ].join(', ') + '}'
    }).join(',')) %>];
var lexer_buffer = "";
var lexer_context = {
    pos : 0,
    ln : 0,
    lnPos : 0
};

var lexer_out_buffer = []; // 为了可以 peek 多个符号而设计

function lexer_in(str){
    lexer_buffer = lexer_buffer + str;
}

function lexer_out(){ // 输出一个符号
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


