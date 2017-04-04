var azureStorage = require('azure-storage');
var mysql = require('mysql');
var crypto = require('crypto');
var tedious = require('tedious');


// ***************************** DATABASE CONNECTION INFOS *****************************

// var azureStorageAccount = process.env.AZURE_STORAGE_ACCOUNT || config.database.AZURE_STORAGE_ACCOUNT;
// var azureStorageAccessKey = process.env.AZURE_STORAGE_ACCESS_KEY || config.database.AZURE_STORAGE_ACCESS_KEY;
// var tableService = azureStorage.createTableService(azureStorageAccount,azureStorageAccessKey);

// var mysqlHost = process.env.MySQL_Host || config.database.MySQL_Host;
// var mysqlUser = process.env.MySQL_User || config.database.MySQL_User;
// var mysqlPassword = process.env.MySQL_Password || config.database.MySQL_Password;
// var mysqlDatabase = process.env.MySQL_Database || config.database.MySQL_Database;
// var mysqlService = mysql.createConnection({
//     host : mysqlHost,
//     user : mysqlUser,
//     password : mysqlPassword,
//     database : mysqlDatabase
// });

var tediousService = null;
var connectionConfig = {
    userName: process.env.DB_user || config.database.DB_user,
    password: process.env.DB_password || config.database.DB_password,
    server: process.env.DB_server || config.database.DB_server,
    options: {
        database: process.env.DB_name || config.database.DB_name,
        encrypt: true,
        rowCollectionOnRequestCompletion: true
    }
};


// ***************************** UTILITIES *****************************

var randomID = function() {

    var rn = function(max) {
        var rnBytes = crypto.randomBytes(2);
        var randomNum = rnBytes.readUInt8(0) * 256 + rnBytes.readUInt8(1);
        return randomNum % max;
    };

    var base62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';//abcdefghiklmnopqrstuvwxyz';

    var len = 6;
    var chars = chars || base62;
    var key = '';
    var charsLen = chars.length;
    for (var i=0; i<len; i++) {
        key += chars[rn(charsLen)];
    }
    return key;
};
var parseResult = function(azureObject) {
    return {
        'id':           azureObject[0]["value"] || '',
        'version':      azureObject[1]["value"] || '0',
        'jsonPayload':  azureObject[2]["value"] || '',
        'name':         azureObject[3]["value"] || '',
        'description':  azureObject[4]["value"] || '',
        'tags':         azureObject[5]["value"] || ''
    };
};
var parseResultFromStorage = function(azureObject) {

    var parsedSnippet = {
        'id':           azureObject['PartitionKey']._ || '',
        'version':      azureObject['RowKey']._ || '',
        'jsonPayload':  azureObject['JsonPayload']._ || '',
        'name':         '',
        'description':  '',
        'tags':         ''
    };
    if(azureObject['Name']) parsedSnippet.name = azureObject['Name']._;
    if(azureObject['Description']) parsedSnippet.description = azureObject['Description']._;
    if(azureObject['Tags']) parsedSnippet.tags = azureObject['Tags']._;

    return parsedSnippet;
};
var parseResults = function(azureObjectTable) {
    var parsedSnippets = [];
    azureObjectTable.forEach(function(object) {
        parsedSnippets.push(parseResult(object));
    });
    return parsedSnippets;
};

var query_migrateSnippets = function(params, onSuccess, onError) {

    var azureQuery = new azureStorage.TableQuery();
    var results = [];

    var next = function(continuationToken) {
        tableService.queryEntities('snippets', azureQuery, continuationToken, function (error, queryResults, response) {
            if (!error) {

                queryResults.entries.forEach(function (snippet) {

                    var one = parseResultFromStorage(snippet);
                    var postObject = {
                        'PartitionKey': one.id,
                        'RowKey': one.version,
                        'JsonPayload': one.jsonPayload,
                        'Name': one.name,
                        'Description': one.description,
                        'Tags': one.tags
                    };
                    var query = mysqlService.query(
                        'INSERT INTO snippets SET ?',
                        postObject,
                        function(err, result) {
                            if(err) console.log(err);
                            else console.log(result);
                        }
                    );
                });

                if(queryResults.continuationToken) {
                    next(queryResults.continuationToken);
                }
                else {
                    console.log("Migration ok !");
                    onSuccess("OK");
                }
            }
            else {
                onError(error);
            }
        });
    };

    mysqlService.connect(function(err) {
        if(err) console.log(err);
        else next(null);
    });
};


// ***************************** SAVE *****************************

var query_saveSnippetNew = function(params, onSuccess, onError) {

    var uniqueId = "";
    do {
        uniqueId = randomID();

        query_getSnippetById(
            { "id": uniqueId },
            function(result) {
                if(result != null && result.length == 0) {

                    var query = new tedious.Request(
                        "INSERT INTO dbo.snippets VALUES (@PartitionKey, @RowKey, @JsonPayload, @Name, @Description, @Tags)",
                        function(err, rowCount, row) {
                            if(err) {
                                onError(err);
                            }
                            else {
                                onSuccess(uniqueId);
                            }
                        }
                    );
                    query.addParameter('PartitionKey', tedious.TYPES.NVarChar , uniqueId);
                    query.addParameter('RowKey', tedious.TYPES.Int, 0);
                    query.addParameter('JsonPayload', tedious.TYPES.Text, JSON.stringify(params['JsonPayload']));
                    query.addParameter('Name', tedious.TYPES.Text, params['Name']);
                    query.addParameter('Description', tedious.TYPES.Text, params['Description']);
                    query.addParameter('Tags', tedious.TYPES.Text, params['Tags']);
                    tediousService.execSql(query);
                }
                else uniqueId = "";
            }, function(error) {
                onError(error);
            }
        );
    }while(uniqueId == "");
};
var query_saveSnippetById = function(params, onSuccess, onError) {

    query_getSnippetById(
        { "id": params['Id'] },
        function(result) {
            if(result != null && result.length == 1) {
                var verison = parseInt(result[0].version) + 1;

                var query = new tedious.Request(
                    "INSERT INTO dbo.snippets VALUES (@PartitionKey, @RowKey, @JsonPayload, @Name, @Description, @Tags) ",
                    function(err, rowCount, row) {
                        if(err) {
                            onError(err);
                        }
                        else {
                            onSuccess(version);
                        }
                    }
                );
                query.addParameter('PartitionKey', tedious.TYPES.NVarChar , params['Id']);
                query.addParameter('RowKey', tedious.TYPES.Int, version);
                query.addParameter('JsonPayload', tedious.TYPES.Text, JSON.stringify(params['JsonPayload']));
                query.addParameter('Name', tedious.TYPES.Text, params['Name']);
                query.addParameter('Description', tedious.TYPES.Text, params['Description']);
                query.addParameter('Tags', tedious.TYPES.Text, params['Tags']);
                tediousService.execSql(query);
            }
            else onError("No playground with this id.");
        }, function(error) {
            onError(error);
        }
    );
};


// ***************************** GET *****************************

var query_getSnippetById = function(params, onSuccess, onError) {

    var next = function() {

        var query = new tedious.Request(
            "SELECT TOP 1" +
            "[PartitionKey]" +
            ",[RowKey]" +
            ",[JsonPayload]" +
            ",[Name]" +
            ",[Description]" +
            ",[Tags]" +
            "FROM [dbo].[snippets]" +
            "WHERE [PartitionKey] = \'" + params["id"] + "\'" +
            "ORDER BY [RowKey] DESC",
            function(err, rowCount, rows) {
                if(err) {
                    onError(err);
                }
                else {
                    onSuccess(parseResults(rows));
                }
            }
        );
        tediousService.execSql(query);
    };

    tediousService = new tedious.Connection(connectionConfig);
    tediousService.on('connect', function(err) {
        if(err) onError(err);
        else next();
    });
};
var query_getSnippetByIdAndVersion = function(params, onSuccess, onError) {

    var next = function() {

        var query = new tedious.Request(
            "SELECT TOP 1" +
            "[PartitionKey]" +
            ",[RowKey]" +
            ",[JsonPayload]" +
            ",[Name]" +
            ",[Description]" +
            ",[Tags]" +
            "FROM [dbo].[snippets]" +
            "WHERE [PartitionKey] = \'" + params["id"] + "\'" +
            "AND [RowKey] = \'" + params["version"] + "\'",
            function(err, rowCount, rows) {
                if(err) {
                    onError(err);
                }
                else {
                    onSuccess(parseResults(rows));
                }
            }
        );
        tediousService.execSql(query);
    };

    tediousService = new tedious.Connection(connectionConfig);
    tediousService.on('connect', function(err) {
        if(err) onError(err);
        else next();
    });
};


// ***************************** SEARCH *****************************

var query_searchSnippetByCode = function(params, onSuccess, onError) {

    var next = function() {

        var query = new tedious.Request(
            "SELECT [PartitionKey]" +
            ",[RowKey]" +
            ",[JsonPayload]" +
            ",[Name]" +
            ",[Description]" +
            ",[Tags]" +
            "FROM [dbo].[snippets]" +
            "WHERE [JsonPayload] LIKE \'%" + params["terms"] + "%\'",
            function(err, rowCount, rows) {
                if(err) {
                    onError(err);
                }
                else {
                    onSuccess(parseResults(rows));
                }
            }
        );
        tediousService.execSql(query);
    };

    tediousService = new tedious.Connection(connectionConfig);
    tediousService.on('connect', function(err) {
        if(err) onError(err);
        else next();
    });
};
var query_searchSnippetByName = function(params, onSuccess, onError) {

    var next = function() {

        var query = new tedious.Request(
            "SELECT [PartitionKey]" +
            ",[RowKey]" +
            ",[JsonPayload]" +
            ",[Name]" +
            ",[Description]" +
            ",[Tags]" +
            "FROM [dbo].[snippets]" +
            "WHERE [Name] LIKE \'%" + params["terms"] + "%\'" +
                "OR [Description] LIKE \'%" + params["terms"] + "%\'",
            function(err, rowCount, rows) {
                if(err) {
                    onError(err);
                }
                else {
                    onSuccess(parseResults(rows));
                }
            }
        );
        tediousService.execSql(query);
    };

    tediousService = new tedious.Connection(connectionConfig);
    tediousService.on('connect', function(err) {
        if(err) onError(err);
        else next();
    });
};
var query_searchSnippetByTags = function(params, onSuccess, onError) {

    var next = function() {

        var query = new tedious.Request(
            "SELECT [PartitionKey]" +
            ",[RowKey]" +
            ",[JsonPayload]" +
            ",[Name]" +
            ",[Description]" +
            ",[Tags]" +
            "FROM [dbo].[snippets]" +
            "WHERE [Tags] LIKE \'%" + params["terms"] + "%\'",
            function(err, rowCount, rows) {
                if(err) {
                    onError(err);
                }
                else {
                    onSuccess(parseResults(rows));
                }
            }
        );
        tediousService.execSql(query);
    };

    tediousService = new tedious.Connection(connectionConfig);
    tediousService.on('connect', function(err) {
        if(err) onError(err);
        else next();
    });
};



var query = function (query, params, onSuccess, onError) {

    switch(query) {

        case "migrateSnippets":
            query_migrateSnippets(params, onSuccess, onError);
            break;


        case "saveSnippetNew":
            query_saveSnippetNew(params, onSuccess, onError);
            break;

        case "saveSnippetById":
            query_saveSnippetById(params, onSuccess, onError);
            break;


        case "getSnippets":
            query_getSnippets(params, onSuccess, onError);
            break;

        case "getSnippetById":
            query_getSnippetById(params, onSuccess, onError);
            break;

        case "getSnippetByIdAndVersion":
            query_getSnippetByIdAndVersion(params, onSuccess, onError);
            break;


        case "searchSnippetByCode":
            query_searchSnippetByCode(params, onSuccess, onError);
            break;

        case "searchSnippetByName":
            query_searchSnippetByName(params, onSuccess, onError);
            break;

        case "searchSnippetByTags":
            query_searchSnippetByTags(params, onSuccess, onError);
            break;


        default:
            break;
    }
};

module.exports = {
    query: query
};