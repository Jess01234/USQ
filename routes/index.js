const { Console } = require('console');
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {

    const User = req.cookies.User;

    if (!User || User.trim() === '') {
        res.redirect('/login');
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
