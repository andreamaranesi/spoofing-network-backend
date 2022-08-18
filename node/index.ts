
import {checkToken, verifyAndAuthenticate, errorHandler} from "./middleware/middleware"

var express = require('express');
var app = express();
  

app.use(checkToken);
app.use(verifyAndAuthenticate);
app.use(errorHandler);

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



app.listen(8080);