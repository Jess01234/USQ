

function HideWindow(){

    var PopUp = document.getElementById("PopUp");

    PopUp.style.display = 'none';
};

function ShowWindow(){

    var PopUp = document.getElementById("PopUp");

    PopUp.style.display = 'flex';
};

function SetVisible(SetVisible, SetInvisible){
    var Visible = document.getElementById(SetVisible);
    var Invisible = document.getElementById(SetInvisible);

    Visible.style.display = 'flex';
    Invisible.style.display = 'none';
}

function ChangeValue(ElementId, Value){
    var Element = document.getElementById(ElementId);

    Element.setAttribute('value', Value)
}

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