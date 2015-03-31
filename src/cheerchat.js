/**
 * Closure
 */
var myUserName = userNameGenerator();
var CheerChat = (function() {
  'use-strict';

  /**
   *
   */
  var CheerChat = function() {
    var that = this;

    that.isConnected = false;

    that._peerConnection = new CheerChat.RTCPeerConnection({
      iceServers : [
        { url : 'stun:stun.l.google.com:19302'},
        { url : 'stun:stun1.l.google.com:19302'},
        { url : 'stun:stun2.l.google.com:19302'},
        { url : 'stun:stun3.l.google.com:19302'}]
    });

    that.strangersCam = document.getElementById('CAMForeign');

    that._peerConnection.onaddstream = function(e) {
      that.strangersCam.src = CheerChat.vendorURL.createObjectURL(e.stream);
    };
  };

  /**
   * Pollyfills
   */
  CheerChat.RTCPeerConnection = window.mozRTCPeerConnection || window.webkitRTCPeerConnection || window.RTCPeerConnection;
  CheerChat.RTCSessionDescription = window.mozRTCSessionDescription || window.webkitRTCSessionDescription || window.RTCSessionDescription;
  navigator.getMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.getUserMedia;
  CheerChat.vendorURL = window.URL || window.webkitURL;

  /**
   * Connects to signalling server.
   */
  CheerChat.prototype.initConnection = function(userName, callback) {
    var that = this;
    that.userName = userName;

    that._peerConnection.onicecandidate = function(e) {
      if (e.candidate == null) {
        return;
      }
      that._signallingSocket.send("candidate", JSON.stringify(e.candidate));
      that._peerConnection.onicecandidate = null;
    };

    that._signallingSocket = new WebSocket('ws://' + location.hostname + ':8081');
    that._signallingSocket.onopen = function(event) {

      var nameChangeObj = {
        cheer_type: "name_change",
        value: that.userName
      };
      that._signallingSocket.send(JSON.stringify(nameChangeObj));
    };

    that._signallingSocket.onmessage = function(msg) {
      var recvData;
      try {
        recvData = JSON.parse(msg.data);
      } catch (e) {
        return;
      }

      if (recvData.cheer_name == that.userName) {
        return;
      }
      if (typeof recvData.value !== 'object' && typeof recvData.value !== 'array') {
        return;
      }

      if(recvData.cheer_type == "offer") {
        var offer = new CheerChat.RTCSessionDescription(recvData.value);
        for (var i in recvData.value) {
          if (!recvData.value.hasOwnProperty(i)) {
            continue;
          }
          offer[i] = recvData.value[i];
        }

        that._peerConnection.setRemoteDescription(offer, function() {
          that._peerConnection.createAnswer(function(answer) {
            answer.cheer_type = "answer";
            that._peerConnection.setLocalDescription(answer, function(){}, function(){});

            var wrapper = {cheer_name : userName, cheer_type : "answer", value : answer, cheer_target : recvData.cheer_name };
            var jsonAnswer = JSON.stringify(wrapper);
            that._signallingSocket.send(jsonAnswer);

            callback(recvData.cheer_name);

            that.isConnected = true;
          });
        }, function(e) {
          console.log('session error:', e);
        });

      } else if (recvData.cheer_type == "answer") {
        var offer = new CheerChat.RTCSessionDescription(recvData.value);
        for (var i in recvData.value) {
          if (!recvData.value.hasOwnProperty(i)) {
            continue;
          }

          offer[i] = recvData.value[i];
        }
        that._peerConnection.setRemoteDescription(offer, function(){}, function(){});
      } else if (recvData.cheer_type == "namelist") {
        var selectElement = document.getElementsByName("chatpartners")[0];
        selectElement.innerHTML = "";
        for (i in recvData.value) {
          if (recvData.value[i] != userName) {
            selectElement.innerHTML += "<option value='" + recvData.value[i] + "'>"
              + recvData.value[i] + "</option>";
          }
        }
      }
    };
  };

  /**
   *
   */
  CheerChat.prototype.connect = function(foreignUser) {
    var that = this;

    if (that.isConnected) {
      //return;
    }

    that._peerConnection.createOffer(
      function(offer) {
        var wrapper = {cheer_name : that.userName, cheer_type : "offer", value : offer, cheer_target : foreignUser };
        that._peerConnection.setLocalDescription(offer, function(){}, function(){});
        that._signallingSocket.send(JSON.stringify(wrapper));

        that.isConnected = true;
        console.log('Connected with other User.');
      }, function(e) {
        console.log('Error 1:', e);
      }, { mandatory : getMandatoryContents() }
    );
  };

  function getMandatoryContents() {
    // boo, case difference!
    if (window.RTCPeerConnection) {
      return {
        'OfferToReceiveAudio' : true,
        'OfferToReceiveVideo' : true
      };
    } else {
      return {
        'offerToReceiveAudio' : true,
        'offerToReceiveVideo' : true
      };
    }
  }

  CheerChat.prototype.startTextChat = function() {
    var that = this;

    that._chatChannel = that._peerConnection.createDataChannel('chat', { reliable: true });
    that._chatChannel.onopen = function(event) {};
    that._chatChannel.onerror = function (err) {
      console.log("Channel Error:", err);
    };

    that._peerConnection.ondatachannel = function (e) {
      e.channel.onmessage = function(e) {
        chatLogElement.innerHTML += "<br>Partner wrote: " + e.data;
        scrollDownHistory();
      };
    };
  };

  CheerChat.prototype.sendMessage = function(msg) {
    var that = this;

    chatLogElement.innerHTML += "<br>You wrote: " + msg;
    that._chatChannel.send(msg);
    scrollDownHistory();
  };

  CheerChat.prototype.startVideo = function(foreignUser) {
    var that = this;
    that.cam = document.getElementById('CAM');

    navigator.getMedia({
      video : true,
      audio : false
    }, function (stream) {
      that.cam.src = CheerChat.vendorURL.createObjectURL(stream);
      that._peerConnection.addStream(stream);

      that.connect(foreignUser);
    }, function(error) {
      console.log(error);
    });
  };

  return CheerChat;
})();

var chat;
var video = false;
function connect() {
  chat = new CheerChat();
  chat.initConnection(myUserName, function(foreignUser) {
    startVideo(foreignUser, false);
  });
}

function startVideo(foreignUser, active) {
  if (!video) {
    if (!active && !window.confirm('Connect video stream with ' + foreignUser + '?')) {
      return;
    }

    chat.startVideo(foreignUser);
    chat.startTextChat(foreignUser);
    video = true;
  }
}

function sendMessage(msg) {
  if (!video) {
    alert('Not connected!');
    return;
  }
  chat.sendMessage(msg);
};


function userNameGenerator() {
  var attributes = ["Stiffler&#39;s", "Bad", "Awesome", "Dancing", "Singing", "Crying", "Cool", "Jim&#39;s"];
  var people = ["Mum", "Grandpa", "Grandma", "Daddy", "Dad"];

  var a = Math.floor(Math.random() * attributes.length);
  var g = Math.floor(Math.random() * people.length);
  return attributes[a] + " " + people[g];
}
