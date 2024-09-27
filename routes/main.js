const express = require('express');
const router = express.Router();

router.get('/main', (req, res) => {
    res.renderFile('main');
});

module.exports = router;