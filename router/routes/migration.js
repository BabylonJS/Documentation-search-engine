/*************************************************************************
 *                             REQUIREMENTS                              *
 ************************************************************************/

var express = require('express'),
    router = express.Router(),
    base = require('../../database/queries');


/************************************************************************
 *                                ROUTES                                *
 ************************************************************************/

// ***************************** GET *****************************

// Default route. Get all the snippets
router.get('/', function(req, res) {

    // res.status(401);
    // res.header("Access-Control-Allow-Origin", "*");
    // res.send("I won't catch'em all!");

    // For debugging purpose only.
    base.query(
        "migrateSnippets", {},
        function(result) {
            if(result != null) send200(res, result);
            else send204(res);
        },
        function(error) {
            send500(res, error);
        }
    );
});


module.exports = router;