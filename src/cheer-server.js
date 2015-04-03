/**
 *
 */
function CheerServer(documentRoot) {
  this.documentRoot = documentRoot || "./public";
  this.http = require('http');
  this.ws = require('ws');
  this.fs = require('fs');
  this.Users = [];
};

/**
 * web server initialization
 */
CheerServer.prototype.createWebServer = function() {
  var parent = this;
  var server = this.http.createServer(function (req, res) {
    var onRequestBase = function (error, data) {
      if (error) {
        console.log(error);
        res.writeHead(404, 'text/plain');
        res.end('NOP');
      } else {
        res.writeHead(200, 'text/html');
        res.end(data);
      }
    };

    if (req.url == '/') {
      parent.fs.readFile(parent.documentRoot + '/index.html', onRequestBase);
      return;
    } else if (req.url == '/cheerchat.js') {
      parent.fs.readFile('./src/cheerchat.js', onRequestBase);
    } else {
      parent.fs.readFile(parent.documentRoot + req.url, function(error, data) {
        if (error) {
          console.log("No resource like that");
          res.writeHead(404, "text/plain");
          res.end("Nope");
        } else {
          res.writeHead(200, "text/html");
          res.end(data);
        }
      });
    }
  });

  server.listen(8080, "0.0.0.0", function() {
    console.log("Server up and running");
  });
};

/**
 * Handle socket connection
 * @param ws.WebSocket socket
 */
CheerServer.prototype.SocketHandlerOnConnection = function(socket) {
  var parent = this;
  socket.cheer_uid = parent.guid();
  parent.Users.push(socket);

  socket.cheer_status = 'no_offer';
  parent.getUserList(socket);

  socket.on('close', function() {
    parent.SocketHandlerOnClose(socket);
  });
  socket.on('message', function(message) {
    parent.SocketHandlerOnMessage(message, socket);
  });
};

/**
 * @param ws.WebSocket socket
 */
CheerServer.prototype.SocketHandlerOnClose = function(socket) {
  var parent = this;
  for (var i = 0; i < parent.Users.length; i++) {
    if (this.Users[i] == socket) {
      delete this.Users[i];
    }
  }
  this.getUserList();
};

/**
 * @param object message
 * @param ws.WebSocket socket
 */
CheerServer.prototype.SocketHandlerOnMessage = function(message, socket) {
  try {
    CheerProperties = JSON.parse(message);

    if (CheerProperties.cheer_type == 'name_change') {
      socket.cheer_name = CheerProperties.value;
      this.getUserList();
    } else if (CheerProperties.cheer_type == 'offer' || CheerProperties.cheer_type == 'answer') {
      this.Users.forEach(function(i){
        if (i.cheer_name === CheerProperties.cheer_target) {
          try {
            i.send(message);
          } catch (e) {}
        }
      });
    } else {
      this.Users.forEach(function(i){
        try {
      	  i.send(message);
      	} catch (e) {}
      	return;
      });
    }
  } catch (e) {
    return;
  }
};

/**
 * @param ws.WebSocket socket
 */
CheerServer.prototype.getUserList = function(socket) {
  var userlist = [];

  for (var userObject in this.Users) {
    if (!this.Users.hasOwnProperty(userObject)) {
      continue;
    }
    userlist.push(this.Users[userObject].cheer_name);
  }

  var userListItem = { cheer_type: "namelist", value: userlist };

  if (null != socket) {
    socket.send(JSON.stringify(userListItem));
    return;
  }

  this.Users.forEach(function(i) {
    try {
      i.send(JSON.stringify(userListItem));
    } catch (e) {}
  });
};

/**
 * helper function
 * @return string
 */
CheerServer.prototype.guid = function() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
};

/**
 * @param Object options
 */
CheerServer.prototype.createWsServer = function(options) {
  var parent = this;
  this.webSocketServer = new this.ws.Server(options);
  this.webSocketServer.on('connection', function(socket) {
    parent.SocketHandlerOnConnection(socket);
  });
};

/**
 * call this to run the servers
 */
CheerServer.prototype.run = function() {
  this.createWebServer();
  this.createWsServer({ port : 8081 });
};

module.exports = CheerServer;
