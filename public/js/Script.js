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