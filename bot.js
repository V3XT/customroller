var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';
// Initialize Discord Bot
var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});
bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});



bot.on('message', (user, userID, channelID, message, event) => {
        // Our bot needs to know if it will execute a command
        // It will listen for messages that will start with `!`
        var prefix = message.substr(0, 2);


        if(is_OL(message)){
            var result = parseOLRoll(message);
            bot.deleteMessage({channelID: channelID, messageID:event.d.id});
            bot.sendMessage({
                to: channelID,
                message: `<@${userID}> ${message} -> ${formatCmdAsOLString(message)} \n**Result:** ${result[0]}\n**Total:** ${result[1]}`
            });
        }

        if (message[0] != "!") return;

        var args = message.split(' '); 
        args = args.filter(Boolean);
   
        switch(prefix){
            case "!r":{
                if (args.length != 2 || !args[1].includes("d") ){
                    bot.sendMessage({
                        to: channelID,
                        message: "Invalid command arguments."
                    });
                    return;
                }

                var input = args[1].split('d');

                var rolls = [];
                var result = 0;

                for(var i = 0; i < input[0]; i++){
                    rolls.push(roll(input[1]));
                    result += rolls[i];
                }

                bot.sendMessage({
                    to: channelID,
                    message: `<@${userID}> ${args[1]} \n**Result:** ${rolls.join(" + ")}\n**Total:** ${result}`
                });
                
                bot.deleteMessage({channelID: channelID, messageID:event.d.id});
                break;


            }
            case "!o":{ //Open Legend
                if(args.length != 2){//Error Checking
                    bot.sendMessage({
                        to: channelID,
                        message: "Invalid command arguments."
                    });
                    return;
                }
                var cmd = args[1];
    
                if(cmd == "h"){
                    bot.sendMessage({
                        to: channelID,
                        message: "**Open Legend ability roll** - !r attributeScore[a|d][modifier]\n\tattributeScore - The attribute score of the ability you are rolling. (0 - 9)\n\ta - advantage is applied to roll. Use with modifer parameter.\n\td - disadvantage is applied to roll. Use with modifer parameter.\n\tmodifier - Number of additional attribute dice to roll, based on advantage or disadvantage. Optional. Use with a or d parameters. (1-9)"
                    });
                } else{
                    var result = parseOLRoll(cmd);
    
                    bot.sendMessage({
                        to: channelID,
                        message: `<@${userID}> ${cmd} -> ${formatCmdAsOLString(cmd)} \n**Result:** ${result[0]}\n**Total:** ${result[1]}`
                    });
                }
    
                bot.deleteMessage({channelID: channelID, messageID:event.d.id});
                break;

            }
            case "!h":{

                param = args.length > 1? args[1]:"x"

                var msg
                switch(param){
                    case "o":{
                        msg = "**Open Legend ability roll** - !o attributeScore[(a|d)modifier]\n" +
                        "\tattributeScore - The attribute score of the ability you are rolling. (0 - 10)\n" +
                        "\ta - advantage is applied to roll. Use with modifier parameter.\n" +
                        "\td - disadvantage is applied to roll. Use with modifier parameter.\n" +
                        "\tmodifier - Number of additional attribute dice to roll, based on advantage or disadvantage. Optional. Use with a or d parameters. (1-9)"
                        break;
                    }
                    case "c":{
                        msg = "Functionality not currently implemented."
                        break;
                    }
                    case "r":{
                        msg = "**Generic dice roll notation** - !r 3d6\n" +
                        "\tFirst number is the number of dice.\n" +
                        "\td is always required.\n" +
                        "\tLast number is the size of the dice being rolled."
                        break;
                    }
                    default:{
                         msg = "Use the following parameters with !h for information on rolling different systems. Ex. *!h r*\n" +
                        "r - Generic dice rolling\n" +
                        "o - OpenLegend\n" +
                        "c - Call of Cthulhu"
                        break;
                    }
                }

                bot.sendMessage({
                    to: channelID,
                    message: msg
                });

            }
            case "!c":{//Call of Cthulhu

                break;
            }
        
        }

    });



//Convert an OL roll command into a more human readable string.
function formatCmdAsOLString(cmd){
    
    msg = "1d20"
    if(cmd[0] != "0") { //Add attribute dice
        var dice = `${attributeRef[cmd[0]][0]}d${attributeRef[cmd[0]][1]}`;
        msg += " + " + dice;
    }
    if (cmd.length>1) //Add advantage/disadvantage and modifer
    {
        msg += cmd[1]=="a"?" advantage ":" disadvantage "
        msg += cmd[2]
    }

    return  msg;
}

function is_OL(str){
    return /^1?[0-9]([ad]\d)?$/.test(str);
}

//parse an OL die roll command to deteremine how to best call the function.
function parseOLRoll(cmd){
    if(cmd.length == 1){
        return openLegendRoll(parseInt(cmd));
    }
    else{
        return openLegendRoll(parseInt(cmd[0]),cmd[1]!="a",parseInt(cmd[2]))
    }
}

//Reference dictionary for OL attributes.
//attribute: [dieCount,dieSize]
var attributeRef ={
    0: [1,20],
    1: [1,4],
    2: [1,6],
    3: [1,8],
    4: [1,10],
    5: [2,6],
    6: [2,8],
    7: [2,10],
    8: [3,6],
    9: [3,8]
}


//Roll an open legend ability roll.
function openLegendRoll(attribute, adv=true, advantageDice=0){

    var total = 0;

    var d20 = []
    d20.push(roll(20));
    
    //adv or disadv on d20 roll
    if(attribute == 0 && advantageDice > 0){
        d20.push(roll(20));
        d20.sort(function(a,b){return a-b});
        if(!adv){
            d20.reverse();
        }
    }
    //Regular ability roll
    else if (attribute > 0) {
        var diceNumber = attributeRef[attribute][0];
        var dieSize = attributeRef[attribute][1];
        var attributeRolls = [];
        for(var i = 0; i < diceNumber + advantageDice; i++){
            attributeRolls.push(roll(dieSize));
        }
        attributeRolls.sort(function(a,b){return a-b});
        if(!adv){
            attributeRolls.reverse();
        }
    }

    d20[0] = explode(attributeRef[0][1], d20[0]);
    total += d20[0];
    var str = `${formatExplodedDie(d20[0],attributeRef[0][1])}`;
    
    //adv or disadv on d20 roll
    if(attribute == 0 && advantageDice > 0){
        str += ` | ~~${d20[1]}~~`;
    }
    //Regular ability roll
    else if (attribute > 0){
        for(var i = 0; i < attributeRolls.length; i++){
            if (i < diceNumber){    //dice included in total
                attributeRolls[i] = explode(dieSize, attributeRolls[i]);
                total += attributeRolls[i];
                str += ` + ${formatExplodedDie(attributeRolls[i],dieSize)}`;
            }
            else{   //dice not included in total
                str += i == diceNumber?" | ":",";
                str += `~~${attributeRolls[i]}~~`;
            }
        }
    }

    return [str,total];
}

//Format an exploded die 
function formatExplodedDie(roll, dieSize){
    var str = `(${roll>dieSize?`${dieSize}!`:roll}`;
    for(var i = roll - dieSize; i > 0; i = i - dieSize){
        str += `,${i>dieSize?dieSize+"!":i%dieSize}`;
    }
    str +=")";
    return str;
}


//Roll a die of dieSize, exploding on the highest value
function explode(dieSize, currentRoll = 0){
    if(dieSize )
    if (currentRoll % dieSize == 0){
        currentRoll += roll(dieSize);
        return explode(dieSize, currentRoll);
    }
    return currentRoll;
}

//Roll a die of dieSize
function roll(dieSize){
    return Math.floor(Math.random() * dieSize) + 1;
}



