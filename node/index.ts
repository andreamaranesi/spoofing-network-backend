

var express = require('express');
const jwt = require('jsonwebtoken');
var app = express();

const {myLogger, requestTime, checkToken, verifyAndAuthenticate, logHerrors, errorHandler} = require("./middleware/middleware.js")
  

app.use(myLogger);
app.use(requestTime);
app.use(checkToken);
app.use(verifyAndAuthenticate);
app.use(errorHandler);

app.get('/', function (req, res) {
  res.send('Hello ' + req.user.GivenName + ' ' + req.user.Surname);
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



app.listen(8080);