var EventEmitter = require('events').EventEmitter;
var assert = require('assert');

var socketConnectionHandling = function(server) {
  var testSocket = new EventEmitter();
  var receivedMessages = [];
  testSocket.send = function(message) {
    receivedMessages.push(message);
  };

  server.emit('connection', testSocket);
  assert.ok(testSocket.cheer_uid);
  assert.equal(testSocket.cheer_status, 'no_offer');

  testSocket.emit('message', '{"cheer_type":"offer"}');
  assert.notEqual(receivedMessages.length, 0);

  var ownOffer = JSON.parse(receivedMessages.pop());
  assert.equal(ownOffer.cheer_type, 'offer');

  var otherTestSocket = new EventEmitter();
  otherTestSocket.send = function() {};
  server.emit('connection', otherTestSocket);
  otherTestSocket.emit('message', '{"cheer_type":"offer"}');
  assert.notEqual(receivedMessages.length, 0);

  var foreignOffer = JSON.parse(receivedMessages.pop());
  assert.equal(foreignOffer.cheer_type, 'offer');

  console.log("Socket Connection Handling test was successful.");
};

exports.test = socketConnectionHandling;
