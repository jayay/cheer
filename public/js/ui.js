var myName;
var chatLogElement = document.getElementById('history');
var textField = document.getElementsByName('textinput')[0];

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
};

scrollDownHistory();

function displayUserName() {
  document.getElementById('myUserName').innerHTML = myUserName;
}

window.setTimeout(function() {
  displayUserName();
  }, 100);
