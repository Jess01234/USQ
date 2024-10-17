
const { Console } = require('console');
var express = require('express');
var router = express.Router();
const { connect, conectar, sql } = require('../models/db');
const sendMail = require('../Mail');

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
                if (Password == String(Res[0].Contrasena)) {
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

router.get('/clients', async function (req, res, next) {
    
    var Profile = await VerifyLoggedUser(req, res);
    
    if(!Profile){
        return;
    }

    var ClientTypeFilter = req.cookies.ClientTypeF || 'All';
    var ClientsFilter = req.cookies.ClientsF || 'IdCliente';
    var ClientsOrder = req.cookies.ClientsO || 'ASC';
    
    var ClientType = req.query.ClientTypeF || ClientTypeFilter;
    var Filter = req.query.Filter || ClientsFilter;
    if((ClientType=='Panel'&&Filter=='ReferenciaP')||(ClientType=='Panel'&&Filter=='Fecha'||(ClientType=='Irrigation'&&Filter=='Correo')||(ClientType=='Irrigation'&&Filter=='NoServicioCFE'))){
        Filter='IdCliente';
    }
    var Order = req.query.Order || ClientsOrder;
    var Searcher = req.query.Searcher || '';

    res.cookie('ClientTypeF', ClientType, { maxAge: 900000, httpOnly: true });
    res.cookie('ClientsF', Filter, { maxAge: 900000, httpOnly: true });
    res.cookie('ClientsO', Order, { maxAge: 900000, httpOnly: true });

    var User = req.cookies.User;

    try {
        var result = await new sql.Request()
            .input('Correo', sql.VarChar, User)
            .query("SELECT * FROM Usuario WHERE Correo = @Correo");

        var Res = result.recordset[0];

        if (Profile === "Admin") {

            if(ClientType=='All'){

                var Query = `SELECT 
                            C.IdCliente, C.Nombre, C.Estado, C.Municipio, C.Localidad, C.Calle, C.Telefono,
                            CP.IdClienteP, CP.Correo, CP.NoServicioCFE,
                            CR.IdClienteR, CR.ReferenciaP, CR.Fecha
                        FROM 
                            Cliente C
                        LEFT JOIN 
                            ClientePanel CP ON C.IdCliente = CP.IdCliente
                        LEFT JOIN 
                            ClienteRiego CR ON C.IdCliente = CR.IdCliente `;
                var Params = [];

                // Verificar si hay algún término de búsqueda
                if (Searcher) {
                    // Dividir los términos por espacio
                    var searchTerms = Searcher.split(' ');

                    // Construir la consulta dinámica
                    var whereClauses = [];
                    searchTerms.forEach((term, index) => {
                        var paramName = `Searcher${index}`;
                        whereClauses.push(`(C.Nombre LIKE @${paramName}
                            OR C.Estado LIKE @${paramName}
                            OR C.Municipio LIKE @${paramName}
                            OR C.Localidad LIKE @${paramName}
                            OR C.Calle LIKE @${paramName}
                            OR C.Telefono LIKE @${paramName}
                            OR CP.Correo LIKE @${paramName}
                            OR CP.NOServicioCFE LIKE @${paramName}
                            OR CR.ReferenciaP LIKE @${paramName} 
                            OR CR.Fecha LIKE @${paramName})`);
                        Params.push({ name: paramName, value: `%${term}%` });
                    });

                    // Unir las cláusulas WHERE con AND para que se busquen todos los términos
                    Query += ' WHERE ' + whereClauses.join(' AND ');
                }
            }
            else if(ClientType=='Panel'){

                var Query = `SELECT 
                            C.IdCliente, C.Nombre, C.Estado, C.Municipio, C.Localidad, C.Calle, C.Telefono,
                            CP.IdClienteP, CP.Correo, CP.NoServicioCFE
                        FROM 
                            Cliente C
                        LEFT JOIN 
                            ClientePanel CP ON C.IdCliente = CP.IdCliente `;
                var Params = [];

                // Verificar si hay algún término de búsqueda
                if (Searcher) {
                    // Dividir los términos por espacio
                    var searchTerms = Searcher.split(' ');

                    // Construir la consulta dinámica
                    var whereClauses = [];
                    searchTerms.forEach((term, index) => {
                        var paramName = `Searcher${index}`;
                        whereClauses.push(`(C.Nombre LIKE @${paramName}
                            OR C.Estado LIKE @${paramName}
                            OR C.Municipio LIKE @${paramName}
                            OR C.Localidad LIKE @${paramName}
                            OR C.Calle LIKE @${paramName}
                            OR C.Telefono LIKE @${paramName}
                            OR CP.Correo LIKE @${paramName}
                            OR CP.NOServicioCFE LIKE @${paramName})`);
                        Params.push({ name: paramName, value: `%${term}%` });
                    });

                    // Unir las cláusulas WHERE con AND para que se busquen todos los términos
                    Query += ' WHERE ' + whereClauses.join(' AND ');
                    Query += ' AND C.IdCliente = CP.IdCliente';
                }
                else{
                    Query += ' WHERE C.IdCliente = CP.IdCliente';
                }
            }
            else if(ClientType=='Irrigation'){

                var Query = `SELECT 
                            C.IdCliente, C.Nombre, C.Estado, C.Municipio, C.Localidad, C.Calle, C.Telefono,
                            CR.IdClienteR, CR.ReferenciaP, CR.Fecha
                        FROM 
                            Cliente C
                        LEFT JOIN 
                            ClienteRiego CR ON C.IdCliente = CR.IdCliente `;
                var Params = [];

                // Verificar si hay algún término de búsqueda
                if (Searcher) {
                    // Dividir los términos por espacio
                    var searchTerms = Searcher.split(' ');

                    // Construir la consulta dinámica
                    var whereClauses = [];
                    searchTerms.forEach((term, index) => {
                        var paramName = `Searcher${index}`;
                        whereClauses.push(`(C.Nombre LIKE @${paramName}
                            OR C.Estado LIKE @${paramName}
                            OR C.Municipio LIKE @${paramName}
                            OR C.Localidad LIKE @${paramName}
                            OR C.Calle LIKE @${paramName}
                            OR C.Telefono LIKE @${paramName}
                            OR CR.Fecha LIKE @${paramName})`);
                        Params.push({ name: paramName, value: `%${term}%` });
                    });

                    // Unir las cláusulas WHERE con AND para que se busquen todos los términos
                    Query += ' WHERE ' + whereClauses.join(' AND ');
                    Query += ' AND C.IdCliente = CR.IdCliente';
                }
                else{
                    Query += ' WHERE C.IdCliente = CR.IdCliente'
                }
            }
            
            // Ordenar los resultados
            Query += ` ORDER BY ${Filter} ${Order}`;

            // Preparar la consulta con parámetros
            var request = new sql.Request();
            Params.forEach(param => {
                request.input(param.name, param.value);
            });

            result = await request.query(Query);
            var Clients = result.recordset;

            res.render('Clients', {
                Name: Res.Nombre,
                TableName: 'Clientes',
                Clients: Clients,
                Filter: Filter,
                Order: Order, 
                Searcher: Searcher,
                ClientType : ClientType
            });
             
            return;
        } else {
            res.render('Error', { Warning: 'No tienes acceso a esta sección' });
            return;
        }
        return;
    } catch (err) {
        res.redirect('/login');
        return;
    }
});

router.get('/employees', async function (req, res, next) {
    
    var Profile = await VerifyLoggedUser(req, res);
    
    if(!Profile){
        return;
    }

    var EmployeesFilter = req.cookies.EmployeesF || 'IdUsuario';
    var EmployeesOrder = req.cookies.EmployeesO || 'ASC';
    
    var Filter = req.query.Filter || EmployeesFilter;
    var Order = req.query.Order || EmployeesOrder;
    var Searcher = req.query.Searcher || '';

    res.cookie('EmployeesF', Filter, { maxAge: 900000, httpOnly: true });
    res.cookie('EmployeesO', Order, { maxAge: 900000, httpOnly: true });

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
                    Order: Order, 
                    Searcher: Searcher
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
    
    if(!Profile){
        return;
    }
    
    var employeeId = req.params.IdUsuario;

    try {
        if (Profile === "Admin") {

            var result = await new sql.Request()
            .input('IdUsuario', employeeId)
            .query("SELECT * FROM Usuario WHERE IdUsuario = @IdUsuario");

            var Users = result.recordset[0];

            if(Users){
                res.render('EmployeeDetails',
                    { 
                        User: Users,
                        Warning: ''
                    });
                    return;
            }
            else{
                res.render('404', {Warning: 'Este usuario no existe o fue eliminado'});
                return;
            }

        } else {
            res.render('Error', { Warning: 'No tienes acceso a esta sección' });
            return;
        }
    } catch (err) {
        res.redirect('/login');
        return
    }
});

router.get('/ClientDetails/:IdCliente', async function (req, res, next) {

    var Profile = await VerifyLoggedUser(req, res);

    if(!Profile){
        return;
    }

    var ClientID = req.params.IdCliente;

    try{
        if(Profile=='Admin'){
            var result = await new sql.Request()
            .input('IdCliente', ClientID)
            .query(`SELECT 
                    C.IdCliente, C.Nombre, C.Estado, C.Municipio, C.Localidad, C.Calle, C.Telefono,
                    CP.IdClienteP, CP.Correo, CP.NoServicioCFE,
                    CR.IdClienteR, CR.ReferenciaP, CR.Fecha
                    FROM 
                    Cliente C
                    LEFT JOIN 
                    ClientePanel CP ON C.IdCliente = CP.IdCliente
                    LEFT JOIN 
                    ClienteRiego CR ON C.IdCliente = CR.IdCliente
                    WHERE C.IdCliente = @IdCliente`);
                    
            var Client = result.recordset[0]

            if(Client){
                res.render('ClientDetails', {
                    Client: Client,
                    Warning: ''
                });
                    return;
            }
            else{
                res.render('404', {Warning: 'Este usuario no existe o fue eliminado'});
                return;
            }
        }
    }
    catch{
        res.redirect('/login');
        return;
    }
})

router.get('/Addemployee', async function (req, res, next) {

    var Profile = await VerifyLoggedUser(req, res);
    
    if(!Profile){
        return;
    }
    else if(Profile!=='Admin'){
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

router.get('/Addclient', async function (req, res, next) {
    
    var Profile = await VerifyLoggedUser(req, res);
    
    if(!Profile){
        return;
    }
    else if(Profile!=='Admin'){
        res.render('error', {
            Warning: 'No tienes acceso a esta seccion'
        });
        return;
    }
    else{
        res.render('ClientAdd', {
            Warning: ''
        });
        return;
    }
})

router.post('/NewClient', async function (req, res, next) {

    var Profile = await VerifyLoggedUser(req, res);
    
    if(!Profile){
        return;
    }

    const User = req.cookies.User;

    var Name = req.body.Name;
    var State = req.body.State;
    var Municipality = req.body.Municipality;
    var Locality = req.body.Locality;
    var Street = req.body.Street;
    var Phone = req.body.Phone;
    
    var Mail = req.body.Mail;
    var CFEService = req.body.CFEService;

    var Reference = req.body.Reference;

    var ClientType = req.body.ClientType;
    var VerifyPass = req.body.VerifyPass;

    var result = await new sql.Request()
            .input('Correo', User)
            .query("SELECT * FROM Usuario WHERE Correo = @Correo");

    var Pass = result.recordset[0].Contrasena;


    if(Name==''||State==''||Municipality==''||Locality==''||Street==''||Phone==''){
        var EmptyInputs = "Los apartados "

        if(Name==''){
            EmptyInputs = EmptyInputs + 'Nombre ';
        }
        if(State==''){
            EmptyInputs = EmptyInputs + 'Estado  ';
        }
        if(Municipality==''){
            EmptyInputs = EmptyInputs + 'Muninipio '
        }
        if(Locality==''){
            EmptyInputs = EmptyInputs + 'Localidad ';
        }
        if(Street==''){
            EmptyInputs = EmptyInputs + 'Calle ';
        }
        if(Phone==''){
            EmptyInputs = EmptyInputs + 'Telefono ';
        }
        EmptyInputs = EmptyInputs + "no deben quedar vacios"
        res.render('Error', {
            Warning: EmptyInputs
        });
        return;
    }
    else if(Name.length > 150){
        res.render('error', {Warning: 'El nombre no debe ser mayor a 150 caracteres'});
        return;
    }
    else if(State.length>50||Municipality.length>50||Locality.length>50||Street.length>50){
        res.render('error', {Warning: 'Los apartados de estado, municipio, localidad y calle no deben sobrepasar 50 caracteres'});
        return
    }
    else if(Phone.length>12){
        res.render('error', {Warning: 'El telefono no debe pasar de 12 caracteres'});
        return;
    }
    else if(Pass!=VerifyPass){
        res.render('error', 'Debes verificar tu contraseña para poder agregar')
        return;
    }
    try{
        var NewClient = await new sql.Request()
        .input('Nombre', Name)
        .input('Estado', State)
        .input('Municipio', Municipality)
        .input('Localidad', Locality)
        .input('Calle', Street)
        .input('Telefono', Phone)
        .query(`INSERT INTO Cliente (Nombre, Estado, Municipio, Localidad, Calle, Telefono)
            OUTPUT INSERTED.IdCliente
            VALUES (@Nombre, @Estado, @Municipio, @Localidad, @Calle, @Telefono)`)
        
        var AddedClient = NewClient.recordset[0].IdCliente;
        
        if(ClientType == 'Panel'){
            if(Mail>30){
                res.render('error',{Warning:'El correo no debe sobrepasar 30 caracteres'})
                return;
            }
            else if(CFEService.length>20){
                res.render('error',{Warning:'El No. de servicio CFE no debe sobrepasar 20 caracteres'})
                return;
            }
            await new sql.Request()
            .input('Correo', Mail)
            .input('NoServicioCFE', CFEService)
            .input('IdCliente', AddedClient)
            .query(`INSERT INTO ClientePanel (Correo, NoServicioCFE, IdCliente) 
                    VALUES (@Correo, @NoServicioCFE, @IdCliente)`);
            res.render('404', {
                Warning: 'Cliente de panel agregado correctamente'
            });
            return;
        }
        else if(ClientType=='Irrigation'){
            if(Reference>200){
                res.render('error',{Warning:'La referencia no debe sobrepasar 200 caracteres'})
                return;
            }
            await new sql.Request()
            .input('ReferenciaP', Reference)
            .input('IdCliente', AddedClient)
            .query(`INSERT INTO ClienteRiego (ReferenciaP, IdCliente) VALUES (@ReferenciaP, @IdCliente)`);

            
            res.render('404', {
                Warning: 'Cliente de riego agregado correctamente'
            });
            return;
        }
    }
    catch{
        res.render('error', {
            Warning: 'Error en el servidor, intenta de nuevo mas tarde'
        });
        return;
    }

})

router.post('/UpdateClient/:IdCliente', async function (req, res, next) {

    var Profile = await VerifyLoggedUser(req, res);
    
    if(!Profile){
        return;
    }

    var ClientID = req.params.IdCliente;
    const User = req.cookies.User;

    var Name = req.body.Name;
    var State = req.body.State;
    var Municipality = req.body.Municipality;
    var Locality = req.body.Locality;
    var Street = req.body.Street;
    var Phone = req.body.Phone;
    
    var Mail = req.body.Mail;
    var CFEService = req.body.CFEService;

    var Reference = req.body.Reference;

    var results = await new sql.Request()
    .input('IdCliente', ClientID)
    .query(`SELECT 
            C.IdCliente, C.Nombre, C.Estado, C.Municipio, C.Localidad, C.Calle, C.Telefono,
            CP.IdClienteP, CP.Correo, CP.NoServicioCFE,
            CR.IdClienteR, CR.ReferenciaP, CR.Fecha
            FROM 
            Cliente C
            LEFT JOIN 
            ClientePanel CP ON C.IdCliente = CP.IdCliente
            LEFT JOIN 
            ClienteRiego CR ON C.IdCliente = CR.IdCliente
            WHERE C.IdCliente = @IdCliente`);
    
    var Client = results.recordset[0];

    if(Client.IdClienteP){
        var ClientType = 'Panel';
    }
    else if(Client.IdClienteR){
        var ClientType = 'Irrigation';
    }
    else{
        var ClientType = 'Panel';
    }

    var VerifyPass = req.body.VerifyPass;

    var result = await new sql.Request()
            .input('Correo', User)
            .query("SELECT * FROM Usuario WHERE Correo = @Correo");

    var Pass = result.recordset[0].Contrasena;

    if(Name==''||State==''||Municipality==''||Locality==''||Street==''||Phone==''){
        var EmptyInputs = "Los apartados "

        if(Name==''){
            EmptyInputs = EmptyInputs + 'Nombre ';
        }
        if(State==''){
            EmptyInputs = EmptyInputs + 'Estado  ';
        }
        if(Municipality==''){
            EmptyInputs = EmptyInputs + 'Muninipio '
        }
        if(Locality==''){
            EmptyInputs = EmptyInputs + 'Localidad ';
        }
        if(Street==''){
            EmptyInputs = EmptyInputs + 'Calle ';
        }
        if(Phone==''){
            EmptyInputs = EmptyInputs + 'Telefono ';
        }
        EmptyInputs = EmptyInputs + "no deben quedar vacios"
        res.render('Error', {
            Warning: EmptyInputs
        });
        return;
    }
    else if(Name.length > 150){
        res.render('error', {Warning: 'El nombre no debe ser mayor a 150 caracteres'});
        return;
    }
    else if(State.length>50||Municipality.length>50||Locality.length>50||Street.length>50){
        res.render('error', {Warning: 'Los apartados de estado, municipio, localidad y calle no deben sobrepasar 50 caracteres'});
        return
    }
    else if(Phone.length>12){
        res.render('error', {Warning: 'El telefono no debe pasar de 12 caracteres'});
        return;
    }
    else if(Pass!=VerifyPass){
        res.render('error', {Warning: 'Debes verificar tu contraseña para poder actualizar'});
        return;
    }
    try{
        var UpdateClient = await new sql.Request()
        .input('Nombre', Name)
        .input('Estado', State)
        .input('Municipio', Municipality)
        .input('Localidad', Locality)
        .input('Calle', Street)
        .input('Telefono', Phone)
        .input('IdCliente', ClientID)
        .query(`UPDATE Cliente
            SET Nombre = @Nombre, Estado = @Estado, Municipio = @Municipio, Localidad = @Localidad, Calle = @Calle, Telefono = @Telefono
            WHERE IdCliente = @IdCliente`)
        
        if(ClientType == 'Panel'){
            if(Mail>30){
                res.render('error',{Warning:'El correo no debe sobrepasar 30 caracteres'})
                return;
            }
            else if(CFEService.length>20){
                res.render('error',{Warning:'El No. de servicio CFE no debe sobrepasar 20 caracteres'})
                return;
            }
            await new sql.Request()
            .input('Correo', Mail)
            .input('NoServicioCFE', CFEService)
            .input('IdCliente', ClientID)
            .query(`UPDATE ClientePanel SET Correo = @Correo, NoServicioCFE = @NoServicioCFE 
                    WHERE IdCliente = @IdCliente`);
            res.render('404', {
                Warning: 'Cliente de panel actualizado correctamente'
            });
            return;
        }
        else if(ClientType=='Irrigation'){
            if(Reference>200){
                res.render('error',{Warning:'La referencia no debe sobrepasar 200 caracteres'})
                return;
            }
            await new sql.Request()
            .input('ReferenciaP', Reference)
            .input('IdCliente', ClientID)
            .query(`UPDATE ClienteRiego SET ReferenciaP = @ReferenciaP
                WHERE IdCliente = @IdCliente`);

            res.render('404', {
                Warning: 'Cliente de riego actualizado correctamente'
            });
            return;
        }
    }
    catch{
        res.render('error', {
            Warning: 'Error en el servidor, intenta de nuevo mas tarde'
        });
        return;
    }

})

router.post("/Adduser", async function (req, res, next) {

    var Profile = await VerifyLoggedUser(req, res);
    
    if(!Profile){
        return;
    }

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
        res.render('Error', {
            Warning: EmptyInputs
        });
        return;
    }
    if (Name.length > 30 || LastName.length > 20 || LastName1.length > 20) {
        res.render('Error', { Warning: 'Los nombres y apellidos no pueden exceder 15 caracteres.' });
        return;
    }
    if (Phone && Phone.length > 12) {
        res.render('Error', { Warning: 'El teléfono no puede exceder 10 caracteres.' });
        return;
    }
    if (Mail.length > 30) {
        res.render('Error', { Warning: 'El correo no puede exceder 30 caracteres.' });
        return;
    }
    if (Password.length < 6 || Password.length > 20) {
        res.render('Error', { Warning: 'La contraseña debe tener al menos 6 caracteres y menos de 20' });
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
        .input('Contrasena', Password)
        .input('Perfil', Profile)
        .query("insert into Usuario(Nombre, ApellidoPaterno, ApellidoMaterno, Telefono, Correo, Contrasena, Perfil) values (@Nombre, @ApellidoPaterno, @ApellidoMaterno, @Telefono, @Correo, @Contrasena, @Perfil)");

        res.render('404', {
            Warning: 'Usuario agregado correctamente'
        })
        return;
    }

    
})

router.post('/UpdateProfile', async function (req, res, next) {

    var Profile = await VerifyLoggedUser(req, res);
    
    if(!Profile){
        return;
    }

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
            if (Name.length > 30 || LastName.length > 20 || LastName1.length > 20) {
                res.render('Error', { Warning: 'El nombre no puede exceder 30 caracteres y apellidos no pueden exceder 20 caracteres.' });
                return;
            }
            if (Phone && Phone.length > 12) {
                res.render('Error', { Warning: 'El teléfono no puede exceder 10 caracteres.' });
                return;
            }
            if (Mail.length > 30) {
                res.render('Error', { Warning: 'El correo no puede exceder 30 caracteres.' });
                return;
            }
            if (Password.length < 6 || Password.length > 20) {
                res.render('Error', { Warning: 'La contraseña debe tener al menos 6 caracteres y menos de 20' });
                return;
            }
            if(Mail!==Res.Correo){
                result = await new sql.Request()
                .input('IdUsuario', ID)
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
            else if (Profile!=='Admin'&&Profile!=='Empleado'&&Profile!=='Proveedor'){
                res.render('Error',
                    {
                        Warning: 'El tipo de perfil debe ser Empleado, Proveedor o Admin'
                    }
                )
                return;
            }
            else if(VerifyPass!==Password){
                res.render('Error', {
                    Warning: 'La contraseña no coincide o esta vacia'
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
                if(Password!==Res.Contrasena){
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
                .query(`UPDATE Usuario SET Nombre = @Nombre, ApellidoPaterno = @ApellidoPaterno, ApellidoMaterno = @ApellidoMaterno, Telefono = @Telefono, Perfil =  @Perfil, Correo = @Correo, Contrasena = @Contrasena WHERE IdUsuario = @IdUsuario`);

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

router.post('/DeleteClient/:IdClient', async function (req, res, next) {

    var ClientId = req.params.IdClient;

    var Profile = await VerifyLoggedUser(req, res);
    if(!Profile){
        return;
    }

    const User = req.cookies.User;
    
    var result = await new sql.Request()
            .input('Correo', User)
            .query("SELECT * FROM Usuario WHERE Correo = @Correo");

    var Pass = result.recordset[0].Contrasena;
    var VerifyPass = req.body.VerifyPass;

    if(Pass !== VerifyPass){
        res.render('Error', {
            Warning: 'Debes verificar la contraseña del perfil para poder eliminar'
        });
        return;
    }
    else{
        await new sql.Request()
        .input('IdUsuario', ClientId)
        .query("DELETE FROM Cliente WHERE IdCliente = @IdUsuario");
        res.render('404', { Warning: 'Usuario eliminado correctamente' });
        return;
    }
});

router.post('/Deleteuser/:IdUsuario', async function (req, res, next) {

    var Profile = await VerifyLoggedUser(req, res);
    
    if(!Profile){
        return;
    }

    var employeeId = req.params.IdUsuario;

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

    var Profile = await VerifyLoggedUser(req, res);
    
    if(!Profile){
        return;
    }

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
        if (Name.length > 30 || LastName.length > 20 || LastName1.length > 20) {
            res.render('Error', { Warning: 'El nombre no puede esceder 30 y apellidos no pueden exceder 15 caracteres.' });
            return;
        }
        if (Phone && Phone.length > 12) {
            res.render('Error', { Warning: 'El teléfono no puede exceder 10 caracteres.' });
            return;
        }
        if (Mail.length > 30) {
            res.render('Error', { Warning: 'El correo no puede exceder 30 caracteres.' });
            return;
        }
        if (Password.length < 6 || Password.length > 20) {
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
            if(Password!==Res.Contrasena){
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
            .query(`UPDATE Usuario SET Nombre = @Nombre, ApellidoPaterno = @ApellidoPaterno, ApellidoMaterno = @ApellidoMaterno, Telefono = @Telefono, Perfil =  @Perfil, Correo = @Correo, Contrasena = @Contrasena WHERE IdUsuario = @IdUsuario`);

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

    var Profile = await VerifyLoggedUser(req, res);
    
    if(!Profile){
        return;
    }

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

    var Profile = await VerifyLoggedUser(req, res);
    
    if(!Profile){
        return;
    }

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

router.get('/RecoverPassword', function(req, res, next){
    res.render('RecoverPassword',
        {
            Warning: ""
        }
    );
});

router.post('/SendPassword', async function(req, res, next){

    var Mail = req.body.Mail;

    try{
        var result = await new sql.Request()
        .input('Correo', Mail)
        .query("SELECT * FROM Usuario WHERE Correo = @Correo")

        if(result.recordset.length > 0) {

            var Pass = result.recordset[0].Contrasena
    
            sendMail(Mail, 'Recuperacion de contraseña', `Tu contraseña actual es: ${Pass}`, res);
            return;
        }
        else {
            res.render('Error', {
                Warning: 'No existe ninguna cuenta con este correo'
            });
            return;
        }

    }
    catch{
        res.render('Error', {
            Warning: 'Error al enviar el correo, intentalo de nuevo mas tarde'
        });
        return;
    }

});

router.get('/LogOut', async function (req, res, next) {
    var Profile = await VerifyLoggedUser(req, res);
    
    if(!Profile){
        return;
    }
    res.clearCookie('User');
    res.redirect("/login");
    return;
});

router.post('/LogOut', async function (req, res, next) {
    var Profile = await VerifyLoggedUser(req, res);
    
    if(!Profile){
        return;
    }

    res.clearCookie('User');
    res.redirect("/login");
    return;
});

module.exports = router;
