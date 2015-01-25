var readline = require('readline');
var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function ask(){
    rl.question("code pls ( like $a=1+$c; ) : ", function(answer){
        var result = parser_parse(answer);
        console.log(JSON.stringify(result));
        process.nextTick(ask);
    });
}
ask();
