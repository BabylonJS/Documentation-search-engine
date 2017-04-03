/*************************************************************************
 *                             REQUIREMENTS                              *
 ************************************************************************/

var express = require('express'),
    router = express.Router(),
    base = require('../../database/queries');


var send200 = function(res, result) {
    res.status(200);
    res.header("Access-Control-Allow-Origin", "*");
    res.send(result);
};
var send204 = function(res) {
    res.status(204);
    res.header("Access-Control-Allow-Origin", "*");
    res.send("No result.");
};
var send400 = function(res) {
    res.status(400);
    res.header("Access-Control-Allow-Origin", "*");
    res.send("400 bad request.");
};
var send500 = function(res, error) {
    console.log(error);
    res.status(500);
    res.header("Access-Control-Allow-Origin", "*");
    res.send("Internal server error.");
};

/************************************************************************
 *                                ROUTES                                *
 ************************************************************************/

// ***************************** GET *****************************

// Default route. Get all the snippets
router.get('/', function(req, res) {
    res.status(401);
    res.header("Access-Control-Allow-Origin", "*");
    res.send("Too much entries to get them all.");
});

// Get a snippet by Id (PartitionKey)
router.get('/:id', function(req, res) {

    if(req.params.id == null) send400(res);
    else
    {
        base.query(
            "getSnippetById", {
                "id": req.params.id
            },
            function(result) {
                if(result != null) send200(res, result);
                else send204(res);
            },
            function(error) {
                send500(res, error);
            }
        );
    }
});

// Get a snippet by Id (PartitionKey) and Version number (RowKey)
router.get('/:id/:version', function(req, res) {

    if(req.params.id == null
    || req.params.version == null) send400(res);
    else
    {
        base.query(
            "getSnippetByIdAndVersion", {
                'id': req.params.id,
                'version': req.params.version
            },
            function(result) {
                if(result != null) send200(res, result);
                else send204(res);
            },
            function(error) {
                send500(res, error);
            }
        );
    }
});


// ***************************** POST *****************************

// Add a new snippet in the database
router.post('/', function(req, res) {

    if(req.body.payload == null
        || req.body.name == null
        || req.body.description == null
        || req.body.tags == null)
    {
        send400(res);
    }
    else
    {
        if(req.body.id && req.body.version) {
            base.query(
                'saveSnippetByIdAndVersion', {
                    'Id': req.body.id,
                    'Version': req.body.version,
                    'JsonPayload': req.body.payload,
                    'Name': req.body.name,
                    'Description': req.body.description,
                    'Tags': req.body.tags
                },
                function(result) {
                    send200(res, result);
                },
                function(error) {
                    send500(res, error);
                }
            );
        }
        else if(req.body.id) {
            base.query(
                'saveSnippetById', {
                    'Id': req.body.id,
                    'JsonPayload': req.body.payload,
                    'Name': req.body.name,
                    'Description': req.body.description,
                    'Tags': req.body.tags
                },
                function(result) {
                    send200(res, result);
                },
                function(error) {
                    send500(res, error);
                }
            );
        }
        else {
            base.query(
                'saveSnippetNew', {
                    'JsonPayload': req.body.payload,
                    'Name': req.body.name,
                    'Description': req.body.description,
                    'Tags': req.body.tags
                },
                function(result) {
                    send200(res, result);
                },
                function(error) {
                    send500(res, error);
                }
            );
        }
    }
});

// // Update client
// router.post('/update/', function(req, res) {
//
//     if(req.body.id == null
//         || req.body.first_name == null
//         || req.body.last_name == null
//         || req.body.birth_date == null)
//     {
//         res.status(400);
//         res.header("Access-Control-Allow-Origin", "*");
//         res.send('400');
//     }
//     else
//     {
//         console.log('try to update');
//         res.status(200);
//         res.header("Access-Control-Allow-Origin", "*");
//         base.query('upsertClient',req,res);
//
//
//
//     }
// });


module.exports = router;