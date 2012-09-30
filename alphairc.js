var app = require('express').createServer()
var io = require('socket.io').listen(app);
var ip = null;
var host = null;
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
		io.sockets.emit('REPLY', server, port);
		socket.net = require('net');
		socket.irc = {};
		socket.irc.socket = new socket.net.Socket();
		socket.irc.socket.connect(port, server);
		socket.irc.socket.on('connect', function(sock) {
						socket.irc.socket.write('WEBIRC password cgiirc ' + host + ' ' + ip + ' \n');
						socket.irc.socket.write('NICK ' + nick + ' \n');
						socket.irc.socket.write('USER ' + username + ' 8 * :' + realname + '\n');
		        });
		socket.irc.socket.on('data', function(data) {
			console.log(data);
    });
	});
	

	socket.on('disconnect', function(){
		// User is disconnected
	});
});
