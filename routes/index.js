const { Console } = require('console');
var express = require('express');
var router = express.Router();
const { connect, conectar, sql } = require('../models/db');

conectar();

router.get('/', async function(req, res, next) {

    const User = req.cookies.User;
    
    if (!User || User.trim() === '') {
        res.redirect('/login');
        console.log(User);
    } else {
        try {
            var result = await new sql.Request().query("select * from Usuario where Correo = '" + User + "'");
            var Res = result.recordset;
            
            var Profile = String(Res[0].Perfil)
            
            if (Profile === "Admin"){
                res.render('index', {Name: Res[0].Nombre});
            }
            else {
                res.render('employee', {Name: Res[0].Nombre});
            }
        }
        catch {
            res.redirect("/login");
        }
    }
});

router.post('/', async function(req, res, next){

    var Mail = req.body.Mail;
    var Password = req.body.Password;
    var Remind = req.body.RememberMe;

    try {
        var result = await new sql.Request().query("select * from Usuario where Correo = '" + Mail + "'");
        var Res = result.recordset;
        console.log(String(Res[0].contrasena));
        if (Res.length > 0){
            if (Password == String(Res[0].contrasena)){
                if(Remind) {
                    res.cookie('User', Mail)
                }
                else {
                    res.cookie('User', Mail, {maxAge: 900000, httpOnly: true});
                }

                var Profile = String(Res[0].Perfil)

                if (Profile === "Admin"){
                    res.render('index', {Name: Res[0].Nombre});
                }
                else {
                    res.render('employee', {Name: Res[0].Nombre});
                }
            }
            else {
                res.render('login', { Warning : "Contraseña incorrecta" });
            }
        }
        else{
            res.render('login', { Warning : "El usuario no existe" });
        }
    } catch (err) {
        res.render('login', { Warning: "Usuario o contraseña incorrectos"});
    }
});

router.get('/login', function(req, res, next){

    const User = req.cookies.User;
    
    if (!User || User.trim() === '') {
        res.render('login', {Warning : ""});
    } else {
        res.redirect('/');
    }
});

router.post('/login', function(req, res, next){
    res.render('login', {Warning : ""});
});

module.exports = router;
