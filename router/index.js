// Require all routes and define general routes
module.exports = function (app) {

    var path = require('path');

    // Default route. Return 400
    app.get('/', function(req, res) {
        res.status(400);
        res.header("Access-Control-Allow-Origin", "*");
        res.sendFile(path.join(__dirname, '../', '/public/index.html'));
    });

    // Test the auth with the very basic token
    // var basicToken = function(req, res, next) {
    //
    //     next();
    //     return;
    //
    //     // if(req.header("token") && require('../basicToken.js')(req.header("token"))) {
    //     //     next();
    //     // }
    //     // else {
    //     //     res.status(401);
    //     //     res.sendFile(path.join(__dirname, '../', '/public/401.html'));
    //     // }
    // };
    // app.use(basicToken);

    // API routes
    app.use('/snippets', require('./routes/snippets'));


    // ERRORS

    // Handle 404
    app.use(function (error, req) {
        req.status(404);
        req.sendFile(path.join(__dirname, '../', '/public/404.html'));
    });

    // Handle 500
    app.use(function (error, req, res, next) {
        res.status(500);
        res.sendFile(path.join(__dirname, '../', '/public/500.html'));
    });

};


// HELP

// Status codes :
// 200 : OK
// 204 : No content
// 400 : Bad request
// 401 : Unauthorized
// 404 : Not found
// 500 : Internal server error
// https://fr.wikipedia.org/wiki/Liste_des_codes_HTTP

// RETURNS
// res.statusCode = 204;                    // Status code
// res.send('Error 204: No result found');  // Envoyer un texte
// res.json(q);                             // Envoyer du JSON

// GET
// app.get('/link/:param&:param2')  // Get parameters
// req.params.id

// POST
// app.post('/link')
// req.body.hasOwnProperty('text')  // Test if the post variable is set
// requ.body.text                   // Get the variable content

// CRUD
//  /api/bears	            GET	Get all the bears.
//  /api/bears	            POST	Create a bear.
//  /api/bears/:bear_id	    GET	Get a single bear.
//  /api/bears/:bear_id	    PUT	Update a bear with new info.
//  /api/bears/:bear_id	    DELETE	Delete a bear.