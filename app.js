
const express = require('express');
const path = require('path');
const app = express();
const cookieParser = require('cookie-parser');

app.set('views', path.join(__dirname, 'views' ));
app.engine ('html ', require('ejs').renderFile);
app.set ('view engine', 'html');

app.use (express.json());
app.use(express.urlencoded({ extended: false }));
app.use (cookieParser ());
app.use (express. static (path. join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.listen(3000, () => {
    console.log('Servidor corriendo en http://localhost:3000');
});

