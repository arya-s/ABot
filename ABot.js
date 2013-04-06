var debug = false,
	irc = require("irc"),
	config = require("./config.json"),
	channesl = [],
	messages = {},
	knownUsers = require("./users.json");

if (debug) {
	channels = getChannels(config.channels.debug);
} else {
	channels = getChannels(config.channels.normal);
}

var bot = new irc.Client(
config.server,
config.botname[0], {
	channels: channels,
	debug: true,
	floodProtection: true,
	floodProtectionDelay: 1000
});

bot.addListener("join", function(channel, who) {
	checkNotes(channel, who);
});

bot.addListener("message", function(nick, to, text, message) {
	console.log("["+to+"] "+nick+": "+text);
	checkNotes(to, nick);
	parseMessage(nick, to, text, message);
});


//----Functions
function parseMessage(nick, to, text, message) {
	var op = text.charAt(0);

	if (op === "!" || op === "?") {
		var splitted = text.split(' ');
		var cmd = splitted.splice(0, 1)[0].substring(1);
		var msg = splitted.join(' ');

		if(op === "!"){
			if(cmd === "note"){
				sendNote(nick, msg);
			}
		} else if(op === "?"){
			if(cmd === "owner"){
				tellOwner(nick, to);
			}
		}
	}
}

function checkNotes(channel, who) {
	var msgs = getMessages(getUser(who));
	for(var m in msgs){
		var message = msgs[m];
		bot.say(channel, who + ": " + message.sender + " left you a note " + timestamp(message.sentAt) + " ago: " + message.content);
	}
}

function tellOwner(nick, to){
	if(nick === "Arya"){
		bot.say(to, "My owner is Arya.");
	} else {
		bot.say(to, "I have no owner. Bow before me lowly human.");
	}
}

function getUser(alias){
	var name = alias.toLowerCase();
	for(var u in knownUsers){
		if(knownUsers[u].indexOf(name) !== -1){
			return u;
		}
	}

	//User was not known, just return the name
	return name;
}

function getMessages(user){
	var msgs = [];

	//Check if there's messages for the user
	if(messages[user] !== undefined){
		var tmpMsgs = messages[user];
		for(var m in tmpMsgs){
			msgs.push(tmpMsgs[m]);
		}

		//Empty since we read it already
		messages[user] = [];
	}

	//Check if there's messages for the aliases
	var aliases = knownUsers[user];
	for(var a in aliases){
		if(messages[aliases[a]] !== undefined){
			var tmpMsgs = messages[aliases[a]];
			for(var m in tmpMsgs){
				msgs.push(tmpMsgs[m]);
			}

			//Empty since we read it already
			messages[aliases[a]] = [];
		}
	}

	//Sort the messages from oldest to newest
	//@see: http://stackoverflow.com/questions/10123953/sort-javascript-object-array-by-date
	msgs.sort(function(a,b){
		a = new Date(a.sentAt);
		b = new Date(b.sentAt);
		return a<b?-1:a>b?1:0;
	});


	return msgs;
}

function sendNote(sender, text) {
	var time = new Date();
	var splitted = text.split(' ');
	var who = splitted.splice(0, 1)[0].toLowerCase();
	var msg = splitted.join(' ');

	if (messages[who] === undefined) {
		messages[who] = [];
	}

	messages[who].push({
		"sender": sender,
		"sentAt": time,
		"content": msg
	});
}

function getChannels(channels) {
	var out = [];
	for (var c in channels) {
		var chan = channels[c];
		var strChan = chan[0] + " ";
		if (chan[1] !== undefined) {
			strChan += chan[1];
		}

		out.push(strChan);
	}

	return out;
}

function timestamp(now) {
	var end = new Date();
	var difference = end - now;
	difference /= 1000;
	var seconds = Math.round(difference % 60);
	difference /= Math.round(60);
	var minutes = Math.round(difference % 60);
	difference /= Math.round(60);
	var hours = Math.round(difference % 24);
	difference /= Math.round(24);
	var days = Math.floor(difference);

	return (days === 0 ? '' : (days === 1 ? days + " day " : days + " days ")) +
	(hours === 0 ? '' : (hours === 1 ? hours + " hour " : hours + " hours ")) +
	(minutes === 0 ? '' : (minutes === 1 ? minutes + " minute " : minutes + " minutes ")) +
	(seconds === 1 ? seconds + " second" : seconds + " seconds");
}