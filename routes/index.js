const { Console } = require('console');
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.post('/', function(req, res, next) {
    res.render('index');
  });

router.get('/main', function(req, res, next){
    const User = req.cookies.User;

    if(!User || User.trim() === ''){
        res.redirect('/');
    }
    else{
        res.render('main', {Name: User});
    }
    
});

router.post('/main', function(req, res, next){
    const Name = req.body.Name;
    const Remind = req.body.RememberMe;

    if (Remind){
        res.cookie('User', Name);
    }
    else{
        res.cookie('User', Name, { maxAge: 900000, httpOnly: true });
    }
    res.render('main', {Name: Name});
});

module.exports = router;
