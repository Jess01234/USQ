const { Console } = require('console');
var express = require('express');
var router = express.Router();
const { connect, conectar, sql } = require('../models/db');

conectar();

router.get('/', async function (req, res, next) {

    const User = req.cookies.User;

    if (!User || User.trim() === '') {
        res.redirect('/login');
        console.log(User);
    } else {
        try {
            var result = await new sql.Request().query("select * from Usuario where Correo = '" + User + "'");
            var Res = result.recordset;

            var Profile = String(Res[0].Perfil)

            if (Profile === "Admin") {
                res.render('index', { Name: Res[0].Nombre });
            }
            else {
                res.render('employee', { Name: Res[0].Nombre });
            }
        }
        catch {
            res.redirect("/login");
        }
    }
});

router.post('/', async function (req, res, next) {

    var Mail = req.body.Mail;
    var Password = req.body.Password;
    var Remind = req.body.RememberMe;

    try {
        var result = await new sql.Request().query("select * from Usuario where Correo = '" + Mail + "'");
        var Res = result.recordset;
        console.log(String(Res[0].contrasena));
        if (Res.length > 0) {
            if (Password == String(Res[0].contrasena)) {
                if (Remind) {
                    res.cookie('User', Mail)
                }
                else {
                    res.cookie('User', Mail, { maxAge: 900000, httpOnly: true });
                }

                var Profile = String(Res[0].Perfil)

                if (Profile === "Admin") {
                    res.render('index', { Name: Res[0].Nombre });
                }
                else {
                    res.render('employee', { Name: Res[0].Nombre });
                }
            }
            else {
                res.render('login', { Warning: "Contraseña incorrecta" });
            }
        }
        else {
            res.render('login', { Warning: "El usuario no existe" });
        }
    } catch (err) {
        res.render('login', { Warning: "Usuario o contraseña incorrectos" });
    }
});

router.post('/UpdateProfile', async function (req, res, next) {

    const User = req.cookies.User;

    var Name = req.body.Name;
    var LastName = req.body.LastName;
    var LastName1 = req.body.LastName1;
    var Phone = req.body.Phone;
    var Mail = req.body.Mail;
    var Password = req.body.Password;

    if (!User || User.trim() === '') {
        res.redirect('/login');
    }

    try {
        var result = await new sql.Request()
            .input('Correo', User) // Consulta con parámetro para seguridad
            .query("SELECT * FROM Usuario WHERE Correo = @Correo");
        
        const ID = result.recordset[0].IdUsuario;

        await new sql.Request()
        .input('Nombre', Name)
        .input('ApellidoPaterno', LastName)
        .input('ApellidoMaterno', LastName1)
        .input('Telefono', Phone)
        .input('Correo', Mail)
        .input('Contrasena', Password)
        .input('IdUsuario', ID)
        .query(`UPDATE Usuario SET Nombre = @Nombre, ApellidoPaterno = @ApellidoPaterno, ApellidoMaterno = @ApellidoMaterno, Telefono = @Telefono, Correo = @Correo, contrasena = @Contrasena WHERE IdUsuario = @IdUsuario`);

        console.log(String("-------Usuario actualizado---------"));
        res.redirect('/login');
    }
    catch {
        console.log(String("-------------Catch ejecutado------------------"));
        res.redirect('/login');
    }
});

router.get('/Profile', async function (req, res, next) {

    const User = req.cookies.User;

    if (!User || User.trim() === '') {
        res.redirect('/login');
    }
    else {
        try {
            var result = await new sql.Request().query("select * from Usuario where Correo = '" + User + "'");
            var Res = result.recordset[0];

            res.render('Profile', { User: Res, Warning: ""});
        }
        catch {
            res.redirect("/login");
        }
    }
});

router.post('/Profile', async function (req, res, next) {
    const User = req.cookies.User;

    if (!User || User.trim() === '') {
        res.redirect('/login');
    }
    else {
        try {
            var result = await new sql.Request().query("select * from Usuario where Correo = '" + User + "'");
            var Res = result.recordset[0];

            res.render('Profile', { User: Res, Warning: "" });
        }
        catch {
            res.redirect("/login");
        }
    }
});

router.get('/login', function (req, res, next) {

    const User = req.cookies.User;

    if (!User || User.trim() === '') {
        res.render('login', { Warning: "" });
    } else {
        res.redirect('/');
    }
});

router.post('/login', function (req, res, next) {
    res.render('login', { Warning: "" });
});

router.get('/LogOut', function (req, res, next) {
    res.clearCookie('User');
    res.redirect("/login");
});

router.post('/LogOut', function (req, res, next) {
    res.clearCookie('User');
    res.redirect("/login");
});

module.exports = router;
