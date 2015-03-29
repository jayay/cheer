var myName;
var chatLogElement = document.getElementById('history');
var textField = document.getElementsByName('textinput')[0];
scrollDownHistory();

window.setTimeout(function() {
  displayUserName();
}, 100);

window.addEventListener("keyup", function (evt) {
    
    if(evt.keyCode == 70) {
        toggleVideoFullscreen();
    }
    
});

/*
    FUNCTIONS
*/

function toggleVideoFullscreen() {
    
    var parentOfVideoWrapper = document.getElementById("cheerwrapper");
    var videoWrapper = document.getElementById("idVideoWrapper");
    
    if(videoWrapper.parentElement == parentOfVideoWrapper) {
        toggleFullScreen();
        
        document.body.appendChild(videoWrapper);
        
        videoWrapper.style.position = "absolute";
        videoWrapper.style.top = "0%";
        videoWrapper.style.left = "0%";
        videoWrapper.style.width = "100%";
        videoWrapper.style.height = "100%";
        
    } else {
        parentOfVideoWrapper.insertBefore(videoWrapper, document.getElementById("chatwindow"));
    }
    
}

function toggleFullScreen() {
  if (!document.fullscreenElement &&    // alternative standard method
      !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement ) {  // current working methods
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    } else if (document.documentElement.msRequestFullscreen) {
      document.documentElement.msRequestFullscreen();
    } else if (document.documentElement.mozRequestFullScreen) {
      document.documentElement.mozRequestFullScreen();
    } else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  }
}

function toggleInputNameWrapper() {
    var elementById = document.getElementById("choosenamewrapper");
    
    if (isInputNameStatusHidden()) {
        elementById.setAttribute("data-hidden", "false");
    } else {
        elementById.setAttribute("data-hidden", "true");
    }
}

function isInputNameStatusHidden() {
    return document.getElementById("choosenamewrapper").getAttribute("data-hidden") == "true";
}

function getForeignName() {
  return document.getElementsByName('chatpartners')[0].value;
}

function changeName() {
    myName = document.getElementsByName("userName")[0].value;
    sendMyName(myName);
}

function scrollDownHistory() {
  var historyDiv = document.getElementById('history');
  historyDiv.scrollTop = historyDiv.scrollHeight;
}

function displayUserName() {
  document.getElementById('myUserName').innerHTML = myUserName;
}
