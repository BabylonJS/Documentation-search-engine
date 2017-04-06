/*************************************************************************
 *                             REQUIREMENTS                              *
 ************************************************************************/

var express = require('express'),
    router = express.Router(),
    base = require('../../database/queries');


// ***************************** SEND MESSAGE *****************************

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
    res.send("I won't catch'em all!");

    // // For debugging purpose only.
    // base.query(
    //     "getSnippets", {},
    //     function(result) {
    //         if(result != null) send200(res, result);
    //         else send204(res);
    //     },
    //     function(error) {
    //         send500(res, error);
    //     }
    // );
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


// Search in the playground code
router.post('/search/code', function(req, res) {

    if(req.body.search == null
        || req.body.page == null
        || req.body.pageSize == null
        || req.body.includePayload == null)
    {
        send400(res);
    }
    else
    {
        base.query(
            "searchSnippetByCode", {
                "terms": req.body.search,
                "page": req.body.page,
                "pageSize": req.body.pageSize
            },
            function(results) {
                if(results != null) {
                    send200(res,results);
                }
                else send204(res);
            },
            function(error) {
                send500(res, error);
            }
        );
    }
});
// Search in name
router.post('/search/name', function(req, res) {

    if(req.body.search == null
        || req.body.page == null
        || req.body.pageSize == null
        || req.body.includePayload == null)
    {
        send400(res);
    }
    else
    {
        base.query(
            "searchSnippetByName", {
                "terms": req.body.search,
                "page": req.body.page,
                "pageSize": req.body.pageSize
            },
            function(results) {
                if(results != null) {
                    send200(res,results);
                }
                else send204(res);
            },
            function(error) {
                send500(res, error);
            }
        );
    }
});
// Search in tags
router.post('/search/tags', function(req, res) {

    if(req.body.search == null
        || req.body.page == null
        || req.body.pageSize == null
        || req.body.includePayload == null)
    {
        send400(res);
    }
    else
    {
        base.query(
            "searchSnippetByTags", {
                "terms": req.body.search,
                "page": req.body.page,
                "pageSize": req.body.pageSize
            },
            function(results) {
                if(results != null) {
                    send200(res,results);
                }
                else send204(res);
            },
            function(error) {
                send500(res, error);
            }
        );
    }
});

// Get search count
router.post('/count/code', function(req, res) {

    if(req.body.search == null) send400(res);
    else
    {
        base.query(
            "countSnippetByCode", {
                "terms": req.body.search
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
router.post('/count/name', function(req, res) {

    if(req.body.search == null) send400(res);
    else
    {
        base.query(
            "countSnippetByName", {
                "terms": req.body.search
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
router.post('/count/tags', function(req, res) {

    if(req.body.search == null) send400(res);
    else
    {
        base.query(
            "countSnippetByTags", {
                "terms": req.body.search
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
});

// Save a new snippet version in the database
router.post('/:id', function(req, res) {

    if(req.params.id == null
        || req.body.payload == null
        || req.body.name == null
        || req.body.description == null
        || req.body.tags == null)
    {
        send400(res);
    }
    else {
        base.query(
            'saveSnippetById', {
                'Id': req.params.id,
                'JsonPayload': req.body.payload,
                'Name': req.body.name,
                'Description': req.body.description,
                'Tags': req.body.tags
            },
            function (result) {
                send200(res, result);
            },
            function (error) {
                send500(res, error);
            }
        );
    }
});



module.exports = router;