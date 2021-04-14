/*
 * @Author: your name
 * @Date: 2021-04-14 15:46:56
 * @LastEditTime: 2021-04-14 16:00:52
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Editnso
 * @FilePath: /agentDemo/app.js
 */
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
 co