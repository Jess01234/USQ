
const { Console } = require('console');
var express = require('express');
var router = express.Router();
const { connect, conectar, sql } = require('../models/db');

conectar();

async function VerifyLoggedUser(req, res){

    var User = req.cookies.User;
    
    if(!User || User.trim() === '') {
        res.redirect('/login');
        return null;
    }
    else {
        try {
            var result = await new sql.Request().query("select * from Usuario where Correo = '" + User + "'");
            var Res = result.recordset;
            if(Res) {
                var Profile = String(Res[0].Perfil)
                return Profile;
            }
            else{
                res.clearCookie('User');
                res.redirect('/login');
                return null;
            }
        }
        catch {
            res.clearCookie('User');
            res.redirect('/login');
            return null;
        }
    }
};

router.get('/', async function (req, res, next) {

    var Profile = await VerifyLoggedUser(req, res);

    if(!Profile){
        return;
    }
    else{

        var User = req.cookies.User;
    
        try {
            
            var result = await new sql.Request().query("select * from Usuario where Correo = '" + User + "'");
            var Res = result.recordset;
    
            if (Profile === "Admin") {
                res.render('index', { Name: Res[0].Nombre });
                return;
            }
            else if(Profile === "Proveedor") {
                res.render('Supplier', { Name: Res[0].Nombre});
                return;
            }
            else {
                res.render('employee', { Name: Res[0].Nombre });
                return;
            }
        }
        catch {
            res.render('404', { Warning: 'El tipo de usuario no existe' });
            return;
        }
    }
});

router.post('/', async function (req, res, next) {

    const User = req.cookies.User;

    if (!User || User.trim() === '') {
        var Mail = req.body.Mail;
        var Password = req.body.Password;
        var Remind = req.body.RememberMe;
    
        try {
            var result = await new sql.Request().query("select * from Usuario where Correo = '" + Mail + "'");
            var Res = result.recordset;

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
                        return;
                    }
                    else if(Profile === "Proveedor") {
                        res.render('Supplier', { Name: Res[0].Nombre});
                        return;
                    }
                    else {
                        res.render('Employee', { Name: Res[0].Nombre });
                        return;
                    }
                }
                else {
                    res.render('login', { Warning: "Contraseña incorrecta" });
                    return
                }
            }
            else {
                res.render('login', { Warning: "El usuario no existe" });
                return;
            }
        } catch (err) {
            res.render('login', { Warning: "Usuario o contraseña incorrectos" });
            return;
        }
    } else {
        res.redirect('/login');
        return;
    }
});

router.get('/employees', async function (req, res, next) {
    
    var Profile = await VerifyLoggedUser(req, res);
    
    var EmployeesFilter = req.cookies.EmployeesF || 'IdUsuario';
    var EmployeesOrder = req.cookies.EmployeesO || 'ASC';
    
    var Filter = req.query.Filter || EmployeesFilter;
    var Order = req.query.Order || EmployeesOrder;
    var Searcher = req.query.Searcher || '';

    res.cookie('EmployeesF', Filter, { maxAge: 900000, httpOnly: true });
    res.cookie('EmployeesO', Order, { maxAge: 900000, httpOnly: true });

    if (!Profile) {
        res.redirect("/login");
        return;
    }

    var User = req.cookies.User;

    try {
        var result = await new sql.Request()
            .input('Correo', sql.VarChar, User)
            .query("SELECT * FROM Usuario WHERE Correo = @Correo");

        var Res = result.recordset[0];

        if (Res) {
            if (Profile === "Admin") {

                var Query = `SELECT * FROM Usuario`;
                var Params = [];
                
                // Verificar si hay algún término de búsqueda
                if (Searcher) {
                    // Dividir los términos por espacio
                    var searchTerms = Searcher.split(' ');

                    // Construir la consulta dinámica
                    var whereClauses = [];
                    searchTerms.forEach((term, index) => {
                        var paramName = `Searcher${index}`;
                        whereClauses.push(`(Nombre LIKE @${paramName} OR ApellidoPaterno LIKE @${paramName} OR ApellidoMaterno LIKE @${paramName} OR Telefono LIKE @${paramName} OR Correo LIKE @${paramName} OR Perfil LIKE @${paramName})`);
                        Params.push({ name: paramName, value: `%${term}%` });
                    });

                    // Unir las cláusulas WHERE con AND para que se busquen todos los términos
                    Query += ' WHERE ' + whereClauses.join(' AND ');
                }
                
                // Ordenar los resultados
                Query += ` ORDER BY ${Filter} ${Order}`;

                // Preparar la consulta con parámetros
                var request = new sql.Request();
                Params.forEach(param => {
                    request.input(param.name, param.value);
                });

                result = await request.query(Query);
                var Users = result.recordset;

                res.render('Table', {
                    Name: Res.Nombre,
                    TableName: 'Empleados y usuarios',
                    Employees: Users,
                    Filter: Filter,
                    Order: Order
                });
                 
                return;
            } else {
                res.render('Error', { Warning: 'No tienes acceso a esta sección' });
                return;
            }
        } else {
            res.redirect('/login');
            return;
        }
    } catch (err) {
        console.error('Error al procesar la solicitud:', err);
        res.redirect('/login');
        return;
    }
});

router.get('/employeedetails/:IdUsuario', async function (req, res, next) {

    var Profile = await VerifyLoggedUser(req, res);
    
    const User = req.cookies.User;

    var employeeId = req.params.IdUsuario;

    try {
        var result = await new sql.Request()
            .input('Correo', User)
            .query("SELECT * FROM Usuario WHERE Correo = @Correo");

        var Res = result.recordset[0];

        if (Res) {

            if (Profile === "Admin") {

                result = await new sql.Request()
                .input('IdUsuario', employeeId)
                .query("SELECT * FROM Usuario WHERE IdUsuario = @IdUsuario");

                var Users = result.recordset[0];

                res.render('EmployeeDetails',
                    { 
                        User: Users,
                        Warning: ''
                    });
                    return;
            } else {
                res.render('Error', { Warning: 'No tienes acceso a esta sección' });
                return;
            }
        } else {
            res.redirect('/login');
            return;
        }
    } catch (err) {
        res.redirect('/login');
        return
    }
});

router.get('/Addemployee', async function (req, res, next) {

    var Profile = await VerifyLoggedUser(req, res);
    
    if(Profile!=='Admin'){
        res.render('error',
            {
                Warning: 'No tienes acceso a esta seccion'
            }
        );
        return;
    }
    else{
        res.render('EmployeeAdd', {
            Warning: ''
        });
        return;
    }
});

router.post("/Adduser", async function (req, res, next) {

    var Name = req.body.Name;
    var LastName = req.body.LastName;
    var LastName1 = req.body.LastName1;
    var Phone = req.body.Phone;
    var Mail = req.body.Mail;
    var Password = req.body.Password;
    var VerifyPass = req.body.VerifyPass;
    var Profile = req.body.Profile;
    
    var result = await new sql.Request()
    .input('Correo', Mail)
    .query("SELECT * FROM USUARIO WHERE Correo = @Correo")

    if(Name==''||LastName==''||LastName1==''||Mail==''||Password==''||Profile==''){
        var EmptyInputs = "Los apartados "

        if(Name==''){
            EmptyInputs = EmptyInputs + 'Nombre ';
        }
        if(LastName==''){
            EmptyInputs = EmptyInputs + 'Apellido paterno ';
        }
        if(LastName1==''){
            EmptyInputs = EmptyInputs + 'Apellido materno '
        }
        if(Mail==''){
            EmptyInputs = EmptyInputs + 'Correo ';
        }
        if(Password==''){
            EmptyInputs = EmptyInputs + 'Contraseña ';
        }
        if(Profile==''){
            EmptyInputs = EmptyInputs + 'Perfil ';
        }
        EmptyInputs = EmptyInputs + "no deben quedar vacios"
        res.render('EmployeeAdd', {
            Warning: EmptyInputs
        });
        return;
    }
    else if( result.recordset.length > 0){
        res.render('Error', { Warning: 'Este correo ya pertenece a otro perfil' });
        return;
    }
    else if (Profile!=='Admin'&&Profile!=='Empleado'&&Profile!=='Proveedor'){
        res.render('Error',
            {
                Warning: 'El tipo de perfil debe ser Empleado, Proveedor o Admin'
            }
        )
        return;
    }
    else if(Password!==VerifyPass){
        res.render('error', {
            Warning: 'Debes repetir la contraseña para poder agregar'
        })
        return;
    }
    else{
        await new sql.Request()
        .input('Nombre', Name)
        .input('ApellidoPaterno', LastName)
        .input('ApellidoMaterno', LastName1)
        .input('Telefono', Phone)
        .input('Correo', Mail)
        .input('contrasena', Password)
        .input('Perfil', Profile)
        .query("insert into Usuario(Nombre, ApellidoPaterno, ApellidoMaterno, Telefono, Correo, contrasena, Perfil) values (@Nombre, @ApellidoPaterno, @ApellidoMaterno, @Telefono, @Correo, @contrasena, @Perfil)");

        res.render('404', {
            Warning: 'Usuario agregado correctamente'
        })
        return;
    }

    
})

router.post('/UpdateProfile', async function (req, res, next) {

    const User = req.cookies.User;

    var Name = req.body.Name;
    var LastName = req.body.LastName;
    var LastName1 = req.body.LastName1;
    var Phone = req.body.Phone;
    var Profile = req.body.Profile;
    var Mail = req.body.Mail;
    var Password = req.body.Password;
    var VerifyPass = req.body.VerifyPass;


    // Verifica si se ha iniciado sesion
    if (!User || User.trim() === '') {
        res.redirect('/login');
        return;
    }

    //Verifica si el usuario con el que se inicio sesion aun existe
    try {
        var result = await new sql.Request()
            .input('Correo', User)
            .query("SELECT * FROM Usuario WHERE Correo = @Correo");
            
        var Res = result.recordset[0];
        const ID = result.recordset[0].IdUsuario;

        try{

            if (Name==''||LastName==''||LastName1==''||Mail==''||Password==''){
                var  EmptyInputs = 'Los apartados ';
                if (!Name) EmptyInputs += 'Nombre ';
                if (!LastName) EmptyInputs += 'Apellido paterno ';
                if (!LastName1) EmptyInputs += 'Apellido materno ';
                if (!Mail) EmptyInputs += 'Correo ';
                if (!Password) EmptyInputs += 'Contraseña ';
                EmptyInputs += 'no pueden quedar vacíos';
                res.render('Profile', { User: Res, Warning: EmptyInputs });
                return;
            }
            if (Name.length > 15 || LastName.length > 15 || LastName1.length > 15) {
                res.render('Error', { Warning: 'Los nombres y apellidos no pueden exceder 15 caracteres.' });
                return;
            }
            if (Phone && Phone.length > 10) {
                res.render('Error', { Warning: 'El teléfono no puede exceder 10 caracteres.' });
                return;
            }
            if (Mail.length > 30) {
                res.render('Error', { Warning: 'El correo no puede exceder 30 caracteres.' });
                return;
            }
            if (Password.length < 6 && Password.length > 20) {
                res.render('Error', { Warning: 'La contraseña debe tener al menos 6 caracteres y menos de 20' });
                return;
            }
            else if (Profile!=='Admin'&&Profile!=='Empleado'&&Profile!=='Proveedor'){
                res.render('Error',
                    {
                        Warning: 'El tipo de perfil debe ser Empleado, Proveedor o Admin'
                    }
                )
                return;
            }
            else if(Password !== VerifyPass){
                res.render('Error', {
                    Warning: 'Debes verificar tu contraseña para poder actualizar tu perfil'
                })
                return;
            }
            else {
                var Updated = 'Usuario actualizado correctamente en: ';

                if(Name!==Res.Nombre){
                    Updated = Updated + 'Nombre '
                }
                if(LastName!==Res.ApellidoPaterno){
                    Updated = Updated + 'Apellido paterno '
                }
                if(LastName1!==Res.ApellidoMaterno){
                    Updated = Updated + 'Apellido materno '
                }
                if(Phone!==Res.Telefono){
                    Updated = Updated + 'Telefono '
                }
                if(Mail!==Res.Correo){
                    Updated = Updated + 'Correo '
                }
                if(Password!==Res.contrasena){
                    Updated = Updated + 'Contraseña '
                }

                await new sql.Request()
                .input('Nombre', Name)
                .input('ApellidoPaterno', LastName)
                .input('ApellidoMaterno', LastName1)
                .input('Telefono', Phone)
                .input('Perfil', Profile)
                .input('Correo', Mail)
                .input('Contrasena', Password)
                .input('IdUsuario', ID)
                .query(`UPDATE Usuario SET Nombre = @Nombre, ApellidoPaterno = @ApellidoPaterno, ApellidoMaterno = @ApellidoMaterno, Telefono = @Telefono, Perfil =  @Perfil, Correo = @Correo, contrasena = @Contrasena WHERE IdUsuario = @IdUsuario`);

                var result = await new sql.Request()
                    .input('Correo', User)
                    .query("SELECT * FROM Usuario WHERE Correo = @Correo");
            
                var Res = result.recordset[0];

                res.render('Profile',
                    {User: Res,
                        Warning: Updated
                    });
                return;
            }
        }
        catch{
            res.redirect('/login');
            return;
        }
    }
    catch {
        res.redirect('/login');
        return;
    }
});

router.post('/Deleteuser/:IdUsuario', async function (req, res, next) {

    var employeeId = req.params.IdUsuario

    var Password = req.body.Password;
    var VerifyPass = req.body.VerifyPass;

    if(Password !== VerifyPass){
        res.render('Error', {
            Warning: 'Debes verificar la contraseña del perfil para poder eliminar'
        });
        return;
    }
    else{
        await new sql.Request()
        .input('IdUsuario', employeeId)
        .query("DELETE FROM Usuario WHERE IdUsuario = @IdUsuario");
        res.render('404', { Warning: 'Usuario eliminado correctamente' });
        return;
    }
});

router.post('/Updateuser/:IdUsuario', async function (req, res, next) {

    var employeeId = req.params.IdUsuario;

    var Name = req.body.Name;
    var LastName = req.body.LastName;
    var LastName1 = req.body.LastName1;
    var Phone = req.body.Phone;
    var Profile = req.body.Profile;
    var Mail = req.body.Mail;
    var Password = req.body.Password;
    var VerifyPass = req.body.VerifyPass;

    var result = await new sql.Request()
    .input('IdUsuario', employeeId)
    .query("SELECT * FROM Usuario WHERE IdUsuario = @IdUsuario");
    
    var Res = result.recordset[0];

    var EmptyInputs;

    try{
        // Verifica que los campos obligatorios no esten vacios
        if (Name==''||LastName==''||LastName1==''||Mail==''||Password==''){
            var  EmptyInputs = 'Los apartados ';
            if (!Name) EmptyInputs += 'Nombre ';
            if (!LastName) EmptyInputs += 'Apellido paterno ';
            if (!LastName1) EmptyInputs += 'Apellido materno ';
            if (!Mail) EmptyInputs += 'Correo ';
            if (!Password) EmptyInputs += 'Contraseña ';
            EmptyInputs += 'no pueden quedar vacíos';
            res.render('Profile', { User: Res, Warning: EmptyInputs });
            return;
        }
        if (Name.length > 15 || LastName.length > 15 || LastName1.length > 15) {
            res.render('Error', { Warning: 'Los nombres y apellidos no pueden exceder 15 caracteres.' });
            return;
        }
        if (Phone && Phone.length > 10) {
            res.render('Error', { Warning: 'El teléfono no puede exceder 10 caracteres.' });
            return;
        }
        if (Mail.length > 30) {
            res.render('Error', { Warning: 'El correo no puede exceder 30 caracteres.' });
            return;
        }
        if (Password.length < 6 && Password.length > 20) {
            res.render('Error', { Warning: 'La contraseña debe tener al menos 6 caracteres y menos de 20' });
            return;
        }
        else if (Profile!=='Admin'&&Profile!=='Empleado'&&Profile!=='Proveedor'){
            res.render('Error',
                {
                    Warning: 'El tipo de perfil debe ser Empleado, Proveedor o Admin'
                }
            );
            return;
        }
        else if(Password !== VerifyPass){
            res.render('Error', {
                Warning: 'Debes verificar la contraseña del perfil para poder actualizar'
            });
            return;
        }
        else {

            var Updated = 'Usuario actualizado correctamente en: ';
            
            if(Name!==Res.Nombre){
                Updated = Updated + 'Nombre '
            }
            if(LastName!==Res.ApellidoPaterno){
                Updated = Updated + 'Apellido paterno '
            }
            if(LastName1!==Res.ApellidoMaterno){
                Updated = Updated + 'Apellido materno '
            }
            if(Phone!==Res.Telefono){
                Updated = Updated + 'Telefono '
            }
            if(Mail!==Res.Correo){
                result = await new sql.Request()
                .input('IdUsuario', employeeId)
                .input('Correo', Mail)
                .query("SELECT * FROM Usuario WHERE Correo = @Correo AND IdUsuario != @IdUsuario");
                
                if( result.recordset.length > 0){
                    res.render('Error', { Warning: 'Este correo ya pertenece a otro usuario o perfil' });
                    return;
                }
                else{
                    Updated = Updated + 'Correo '
                }
            }
            if(Password!==Res.contrasena){
                Updated = Updated + 'Contraseña '
            }

            await new sql.Request()
            .input('IdUsuario', employeeId)
            .input('Nombre', Name)
            .input('ApellidoPaterno', LastName)
            .input('ApellidoMaterno', LastName1)
            .input('Telefono', Phone)
            .input('Perfil', Profile)
            .input('Correo', Mail)
            .input('Contrasena', Password)
            .query(`UPDATE Usuario SET Nombre = @Nombre, ApellidoPaterno = @ApellidoPaterno, ApellidoMaterno = @ApellidoMaterno, Telefono = @Telefono, Perfil =  @Perfil, Correo = @Correo, contrasena = @Contrasena WHERE IdUsuario = @IdUsuario`);

            var result = await new sql.Request()
            .input('IdUsuario', employeeId)
            .query("SELECT * FROM Usuario WHERE IdUsuario = @IdUsuario");
        
            var Res = result.recordset[0];

            res.render('EmployeeDetails',
                { 
                    User: Res,
                    Warning: Updated
                });
            return;
        }
    }
    catch{
        res.redirect('/login');
        return;
    }
});

router.get('/Profile', async function (req, res, next) {

    const User = req.cookies.User;

    if (!User || User.trim() === '') {
        res.redirect('/login');
        return;
    }
    else {
        try {
            var result = await new sql.Request().query("select * from Usuario where Correo = '" + User + "'");
            var Res = result.recordset[0];

            res.render('Profile', { User: Res, Warning: ""});
            return;
        }
        catch {
            res.redirect("/login");
            return;
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
            return;
        }
        catch {
            res.redirect("/login");
            return;
        }
    }
});

router.get('/login', function (req, res, next) {

    const User = req.cookies.User;

    if (!User || User.trim() === '') {
        res.render('login', { Warning: "" });
        return;
    } else {
        res.redirect('/');
        return;
    }
});

router.post('/login', function (req, res, next) {
    
    const User = req.cookies.User;

    if (!User || User.trim() === '') {
        res.render('login', { Warning: "" });
    } else {
        res.redirect('/');
    }
    return;
});

router.get('/LogOut', function (req, res, next) {
    res.clearCookie('User');
    res.redirect("/login");
    return;
});

router.post('/LogOut', function (req, res, next) {
    res.clearCookie('User');
    res.redirect("/login");
    return;
});

module.exports = router;
