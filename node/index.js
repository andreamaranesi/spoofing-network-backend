"use strict";
exports.__esModule = true;
var middleware_1 = require("./middleware/middleware");
var express = require('express');
var app = express();
app.use(middleware_1.checkToken);
app.use(middleware_1.verifyAndAuthenticate);
app.use(middleware_1.errorHandler);
app.get('/', function (req, res) {
    res.send('Hello ' + req.user.email);
});
app.get('/a', function (req, res) {
    res.send('Hello ' + req.user.GivenName + ' ' + req.user.Surname);
});
app.get('/b', function (req, res) {
    res.send('Hello ' + req.user.GivenName + ' ' + req.user.Surname);
});
app.get('/c', function (req, res) {
    res.send('Hello ' + req.user.GivenName + ' ' + req.user.Surname);
});
app.listen(3000, '0.0.0.0');
console.log("avviato");
