
var SUPER_SYMBOL_END = "$$";

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
    pda_in(wrapSymbol(SUPER_SYMBOL_END));
    return parser_accept_callback_result;
}

function pda_accept_callback(result){
    parser_accept_callback_result = result;
}


