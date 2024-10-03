const { Console } = require('console');
var express = require('express');
var router = express.Router();
const sql = require('mssql');

const config = {
    server: '192.168.1.78',
    user: 'sa',
    password: '12345',
    database: 'Urban_Solar'
};

async function connectToDatabase() {
    try {
        let pool = await sql.connect(config);
        console.log('Conexión exitosa a la base de datos SQL Server');

        // let result = await pool.request().query('SELECT * FROM TuTabla');
        // console.log(result);

    } catch (err) {
        console.error('Error al conectarse a la base de datos:', err);
    }
}

connectToDatabase();

/* GET home page. */
router.get('/', function(req, res, next) {

    const User = req.cookies.User;
    // var consulta;

    // connection.query('SELECT * FROM `users` WHERE `id` = 1', (err, results) => {
    //     if(err) throw err;
    //     consulta = results;
    //     console.log(consulta);
    // });

    if (!User || User.trim() === '') {
        res.redirect('/login');
        console.log()
    } else {
        res.render('index', { Name: User });
    }
});

router.post('/', function(req, res, next){
    const Name = req.body.Name;
    const Remind = req.body.RememberMe;
    
    if (Remind){
        res.cookie('User', Name);
    }
    else{
        res.cookie('User', Name, { maxAge: 900000, httpOnly: true });
    }
    res.render('index', {Name: Name});
});

router.get('/login', function(req, res, next){

    const User = req.cookies.User;
    
    if (!User || User.trim() === '') {
        res.render('login');
    } else {
        res.redirect('/');
    }
});

router.post('/login', function(req, res, next){
    res.render('login');
});

module.exports = router;
