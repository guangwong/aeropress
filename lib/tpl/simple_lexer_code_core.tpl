
var lexer_rules = [<% print(rules.map(function(n){
        return  '{' + [
            '"symbol":"' + n.symbol + '"',
            '"reg":' + n.reg.toString(),
            '"fn":' + (n.fn ? n.fn.toString() : null),
        ].join(', ') + '}'
    }).join(',')) %>];

var lexer_ignore = <% print(JSON.stringify(ignore)) %>;

var lexer_buffer;
var lexer_context;
var lexer_out_buffer; // 為了 LL 時進行符號 Peek 設計的

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

function lexer_out(){ // 輸出一個符號
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
        throw (new Error("未知符號在> " + lexer_format_context() ));
    }

    tok.pos = lexer_context.pos;
    tok.ln = lexer_context.ln;
    lexer_context.pos += tok.posInc;
    lexer_context.ln += tok.lnInc;
    if(lexer_context.lnInc){ // When new line.
        lexer_context.lnPos = 0;
    }
    lexer_context.lnPos += tok.lnPosInc;
    if(tok.symbol in lexer_ignore){
        return lexer_out();
    }
    return tok;
}

function lexer_peek(){ // 向偷看一個符號

    var tok;

    if(lexer_out_buffer.length){
        tok = lexer_out_buffer.shift();
    }else{
        tok = lexer_match();
    }

    if(!tok){
        throw (new Error("未知符號在> ", + lexer_format_context() ));
    }

    return tok;

}

function lexer_match(){ // Match a tok

    var curText = lexer_buffer.substring(lexer_context.pos);
    var tokMatched = null;

    for(var idx = 0, len = lexer_rules.length; idx < len; idx++){
        var rule = lexer_rules[idx];
        var regRet  = rule.reg.exec(curText);  // 長的優先，同長度後來者優先
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
    var curText = lexer_buffer.substring(lexer_context.pos);
    return '"' + curText.substring(0,128) + '"';
}

