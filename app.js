var bodyParser = require('body-parser');
var express = require('express');
var app     = express();
var path = require('path');

// The listened port
var port    = process.env.PORT || 3000;


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve public folder
app.use(express.static(path.join(__dirname, '/public')));


var routes = require('./router/index.js')(app);


module.exports = app;