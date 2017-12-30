const express = require('express');
const bodyParser = require('body-parser');
const app = new express();

app.use('/', express.static('dist'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));


let storage = null;

app.all('/api/save', (req, res) => {
    storage = req.body;
    res.set('Content-Type', 'text/json; charset=utf-8');
    res.json({
        errCode: 0,
        errMsg: ''
    });
});

app.all('/api/data', (req, res) => {
    res.set('Content-Type', 'text/json; charset=utf-8');
    res.json(storage);
});

app.listen(8081);