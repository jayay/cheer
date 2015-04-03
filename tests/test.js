var assert = require('assert');
var cheer = require('../src/cheer-server');
var connTest = require('./server-connection-handling');

var cheerServer = new cheer();
// "noServer: true" passes anything directly
cheerServer.createWsServer( { noServer: true } );
assert.ok(cheerServer.webSocketServer);

connTest.test(cheerServer.webSocketServer);
