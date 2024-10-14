const { format } = require("path");


function HideWindow(){

    var PopUp = document.getElementById("PopUp");

    PopUp.style.display = 'none';
};

function ShowWindow(){

    var PopUp = document.getElementById("PopUp");

    PopUp.style.display = 'flex';
};

function ChangeForm(ElementId, action) {
    var Form = document.getElementById(ElementId);
    Form.setAttribute('action', action);
    Form.submit();
}

function AlterVisiblePassword(ElementId) {
    var PassInput = document.getElementById(ElementId);
    
    if (PassInput.type === 'password') {
        PassInput.setAttribute('type', 'text');
    } else {
        PassInput.setAttribute('type', 'password');
    }
}

function RedirectForm(ElementId, action, method){
    var Form = document.getElementById(ElementId);
    Form.setAttribute('action', action);
    Form.setAttribute('method', method)
    Form.submit();
}