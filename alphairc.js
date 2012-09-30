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
		io.sockets.emit('REPLY', server, port);
		socket.net = require('net');
		socket.irc = {};
		socket.irc.socket = new socket.net.Socket();
		//socket.irc.socket.setEncoding('ascii');
		socket.irc.socket.connect(port, server);
		socket.irc.socket.on('connect', function(sock) {
			socket.irc.socket.write('WEBIRC ' + webirc_pass + ' cgiirc ' + host + ' ' + ip + ' \n');
			socket.irc.socket.write('NICK ' + nick + ' \n');
			socket.irc.socket.write('USER ' + username + ' 8 * :' + realname + '\n');
			console.log("Connected!\n");
			io.sockets.emit('IRC_CONNECTED', "connected");
		});
		//:Gangnam.NJ.US.AlphaChat.net 376 DjTester :End of /MOTD command.
		socket.irc.socket.on('data', function(data) {
			
			var data = data.toString();
			console.log('[RECV] ' + data + '');
			var parts = data.split(' ');
			if(parts[0] == "PING") { 
				socket.irc.socket.write('PONG :' + parts[1] + ' \n');
			}
			if(parts[1] == "NOTICE") {
				var fullmsg = data.split(' ', 3);
				io.sockets.emit('IRC_NOTICE', parts[0], fullmsg[2]);
			}
			
		});
		socket.irc.socket.on('end', function(sock) {
			io.sockets.emit('IRC_DISCON', sock);
		});
		socket.on('IRC_SEND', function(command){
			console.log(command);
			socket.irc.socket.write('' + command + '\n');
		});

		// END
	});
	

	socket.on('disconnect', function(){
		// User is disconnected
	});
});
