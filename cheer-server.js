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
  if(req.url == '/') {
    parent.fs.readFile(parent.documentRoot + '/index.html', function(error, data) {
      if (error) {
        console.log(error);
        res.writeHead(404, 'text/plain');
        res.end('NOP');
      } else {
        res.writeHead(200, 'text/html');
        res.end(data);
      }
    });
  return;
  }

    parent.fs.readFile(parent.documentRoot + req.url, function(error, data) {
      if(error) {
        console.log("No resource like that");
        res.writeHead(404, "text/plain");
        res.end("Nope");
      } else {
        res.writeHead(200, "text/html");
        res.end(data);
      }
    });
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
  socket.Joghurt_uid = parent.guid();
  parent.Users.push(socket);

  socket.Joghurt_status = 'no_offer';
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
    Joghurt = JSON.parse(message);

    if (Joghurt.Joghurt_type == 'name_change') {
      socket.Joghurt_name = Joghurt.value;
      this.getUserList();
    } else if (Joghurt.Joghurt_type == 'offer' || Joghurt.Joghurt_type == 'answer') {
      this.Users.forEach(function(i){
        if (i.Joghurt_name === Joghurt.Joghurt_target) {
          try {
            i.send(message);
          } catch (e) {
            console.log("again", e);
          }
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
    userlist.push(this.Users[userObject].Joghurt_name);
  }

  var userListItem = {Joghurt_type: "namelist", value: userlist};

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
 * call this to run the servers
 */
CheerServer.prototype.run = function() {
  var parent = this;
  this.createWebServer();

  this.webSocketServer = new this.ws.Server({ port : 8081 });
  this.webSocketServer.on('connection', function(socket) {
    parent.SocketHandlerOnConnection(socket);
  });
};

module.exports = CheerServer;
