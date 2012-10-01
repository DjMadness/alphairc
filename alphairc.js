var app = require('express').createServer()
var io = require('socket.io').listen(app);
io.set('log level', 1);
var ip = null;
var host = null;
var webirc_pass = "password";
app.listen(6969);
app.get('/', function (req, res) {
	ip = req.connection.remoteAddress;
	try {
		require('dns').reverse(ip, function(err,result) { host = result });
	}
	catch(err)
	{
		host = ip;
	}
  res.sendfile(__dirname + '/index.html');
});

// usernames which are currently connected to the chat
var usernames = {};

io.sockets.on('connection', function (socket) {
	socket.on('IRC_CONNECT', function (server, port, nick, username, realname) {
		var servername = null;
		var networkname = null;
		socket.nickset = null;
		socket.emit('REPLY', server, port);
		socket.net = require('net');
		socket.irc = {};
		socket.irc.socket = new socket.net.Socket();
		socket.irc.socket.setEncoding('ascii');
		socket.irc.socket.setNoDelay();
		socket.irc.socket.connect(port, server);
		socket.irc.socket.on('connect', function(sock) {
			socket.irc.socket.write('WEBIRC ' + webirc_pass + ' cgiirc ' + host + ' ' + ip + ' \n');
			socket.irc.socket.write('NICK ' + nick + ' \n');
			socket.irc.socket.write('USER ' + username + ' 8 * :' + realname + '\n');
			console.log("Connected!\n");
			socket.emit('IRC_CONNECTED', "connected");
		});
		//:Gangnam.NJ.US.AlphaChat.net 376 DjTester :End of /MOTD command.
		socket.irc.socket.on('data', function(data) {
			socket.line = data.split('\r\n');
			socket.line.forEach(function (data) {
				if(socket.data != '') {
					console.log('[RECV] ' + data + '');
				}
				socket.parts = data.split(' ');
				if(socket.parts[0] == "PING") { 
					socket.irc.socket.write('PONG :' + socket.parts[1] + ' \n');
				}
				if((socket.parts[1] == "NOTICE") && (socket.parts[2] != "*")) {
					socket.message = socket.parts.slice(3);
					socket.message = socket.message.toString();
					socket.message = socket.message.replace(":", "");
					socket.emit('IRC_NOTICE', socket.parts[0], socket.message);
				}
				// :Gangnam.NJ.US.AlphaChat.net 433 DjTester DjMadness :Nickname is already in use.
				if(socket.parts[1] == "433") {
					if(socket.nickset != true) {
						console.log("CHANGE NICK");
						socket.irc.socket.write('NICK ' + socket.parts[3] + '_ \n');
					}
					else {
						socket.emit('IRC_NICK_IN_USE', socket.parts[3]);
					}
				}
				//:DjMadness!DjMadness@DjMadness.Users.AlphaChat.Net PRIVMSG #lobby :test
				if(socket.parts[1] == "PRIVMSG") {
					socket.message = socket.parts.slice(3);
					socket.message = socket.message.toString();
					socket.message = socket.message.replace(":", "");
					socket.emit('IRC_PRIVMSG', socket.parts[0], socket.message);
				}
				if(socket.parts[1] == "005") {
					socket.message = socket.parts.slice(3);
					socket.message = socket.message.toString();
					socket.message = socket.message.replace(":", "");
					socket.nickset = true;
					socket.emit('IRC_STATUS_RAW', socket.parts[0], socket.message);
				}
				
				
			});
					
			
			// :Gangnam.NJ.US.AlphaChat.net 005 DjTester EXTBAN=$,acjorsxz WHOX CLIENTVER=3.0 SAFELIST ELIST=CTU :are supported by this server
			// :DjMadness!DjMadness@DjMadness.Users.AlphaChat.Net PART #lobby
			// :DjMadness!DjMadness@DjMadness.Users.AlphaChat.Net JOIN :#lobby
			// :Alpha!Alpha@irc.AlphaChat.net MODE #lobby +ao DjMadness DjMadness

			
		});
		socket.irc.socket.on('end', function(sock) {
			io.sockets.emit('IRC_DISCON', sock);
		});
		socket.on('IRC_SEND', function(command){
			
			socket.irc.socket.write('' + command + '\n');
		});
		socket.on('end', function(){
			socket.irc.socket.write('QUIT :AlphaIRC - client disconnected\n');
		});
		// END
	});
	

	
});
