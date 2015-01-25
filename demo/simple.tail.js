var readline = require('readline');
var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function ask(){
    rl.question("code pls ( like $a=1+$c; ) : ", function(answer){
        try{
            var result = parser_parse(answer);
            console.log(JSON.stringify(result));
        }catch(err){
            console.error(err);
        }
        setTimeout(ask, 500);
    });
}
ask();
