
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var MySql = require('mysql2');

var indexRouter = require('./routes/index');

var app = express();


// var port = 3000;
// app.listen(port, '0.0.0.0', () => {
//     console.log(`Servidor escuchando en http://0.0.0.0:${port}`);
// });

const connection = MySql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'urbansolar'
    // host: '192.168.1.78',
    // user: 'root',
    // password: '',
    // database: 'test'
});

connection.connect((err) => {
    if (err) {
      console.error('Error al conectar a la base de datos:', err);
      return;
    }
    console.log('Conectado a la base de datos MySQL.');
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
