var crypto = require('crypto');
var tedious = require('tedious');


// ***************************** DATABASE CONNECTION INFOS *****************************

var tediousService = null;
var connectionConfig = {
    userName: process.env.DB_user || config.database.DB_user,
    password: process.env.DB_password || config.database.DB_password,
    server: process.env.DB_server || config.database.DB_server,
    options: {
        database: process.env.DB_name || config.database.DB_name,
        encrypt: true,
        rowCollectionOnRequestCompletion: true,
        requestTimeout: 0
    }
};


// ***************************** UTILITIES *****************************

var randomID = function() {

    var rn = function(max) {
        var rnBytes = crypto.randomBytes(2);
        var randomNum = rnBytes.readUInt8(0) * 256 + rnBytes.readUInt8(1);
        return randomNum % max;
    };

    var chars = '0123456789ABCDEFGHIJKLMNPQRSTUVWXYZ'; // No letter O, like number 0

    var len = 6;
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
var parseResults = function(azureObjectTable) {
    var parsedSnippets = [];
    azureObjectTable.forEach(function(object) {
        parsedSnippets.push(parseResult(object));
    });
    return parsedSnippets;
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
                        "INSERT INTO dbo.Snippets VALUES (@Id, @Version, @SnippetIdentifier, @JsonPayload, @Name, @Description, @Tags)",
                        function(err, rowCount, row) {
                            if(err) {
                                onError(err);
                            }
                            else {
                                onSuccess(uniqueId);
                                query_updateSnippetInfos({
                                    Id: uniqueId,
                                    Name: params['Name'],
                                    Description: params['Description'],
                                    Tags: params['Tags'],
                                });
                            }
                        }
                    );
                    query.addParameter('Id', tedious.TYPES.NVarChar , uniqueId);
                    query.addParameter('Version', tedious.TYPES.Int, 0);
                    query.addParameter('SnippetIdentifier', tedious.TYPES.NVarChar, uniqueId + "-" + 0);
                    query.addParameter('JsonPayload', tedious.TYPES.Text, JSON.stringify(params['JsonPayload']));
                    query.addParameter('Name', tedious.TYPES.NVarChar, params['Name']);
                    query.addParameter('Description', tedious.TYPES.NVarChar, params['Description']);
                    query.addParameter('Tags', tedious.TYPES.NVarChar, params['Tags']);
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
                var version = parseInt(result[0].version) + 1;

                var query = new tedious.Request(
                    "INSERT INTO dbo.Snippets VALUES (@Id, @Version, @SnippetIdentifier, @JsonPayload, @Name, @Description, @Tags) ",
                    function(err, rowCount, row) {
                        if(err) {
                            onError(err);
                        }
                        else {
                            onSuccess(version);
                            query_updateSnippetInfos({
                                Id: params['Id'],
                                Name: params['Name'],
                                Description: params['Description'],
                                Tags: params['Tags'],
                            });
                        }
                    }
                );
                query.addParameter('Id', tedious.TYPES.NVarChar , params['Id']);
                query.addParameter('Version', tedious.TYPES.Int, version);
                query.addParameter('SnippetIdentifier', tedious.TYPES.NVarChar, params['Id'] + '-' + version);
                query.addParameter('JsonPayload', tedious.TYPES.Text, JSON.stringify(params['JsonPayload']));
                query.addParameter('Name', tedious.TYPES.NVarChar, params['Name']);
                query.addParameter('Description', tedious.TYPES.NVarChar, params['Description']);
                query.addParameter('Tags', tedious.TYPES.NVarChar, params['Tags']);
                tediousService.execSql(query);
            }
            else onError("No playground with this id.");
        }, function(error) {
            onError(error);
        }
    );
};

var query_updateSnippetInfos = function(params) {

    var query = new tedious.Request(
        "UPDATE dbo.Snippets " +
        "SET [Name] = @Name, [Description] = @Description, [Tags] = @Tags " +
        "WHERE [Id] = @Id",
        function(err, rowCount, row) {}
    );
    query.addParameter('Id', tedious.TYPES.NVarChar , params['Id']);
    query.addParameter('Name', tedious.TYPES.NVarChar, params['Name']);
    query.addParameter('Description', tedious.TYPES.NVarChar, params['Description']);
    query.addParameter('Tags', tedious.TYPES.NVarChar, params['Tags']);
    tediousService.execSql(query);
};


// ***************************** GET *****************************

var query_getSnippetById = function(params, onSuccess, onError) {

    var next = function() {

        var query = new tedious.Request(
            "SELECT TOP 1" +
            "[Id]" +
            ",[Version]" +
            ",[JsonPayload]" +
            ",[Name]" +
            ",[Description]" +
            ",[Tags]" +
            "FROM [dbo].[snippets]" +
            "WHERE [Id] = \'" + params["id"] + "\'" +
            "ORDER BY [Version] DESC",
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
            "[Id]" +
            ",[Version]" +
            ",[JsonPayload]" +
            ",[Name]" +
            ",[Description]" +
            ",[Tags]" +
            "FROM [dbo].[snippets]" +
            "WHERE [Id] = \'" + params["id"] + "\'" +
            "AND [Version] = \'" + params["version"] + "\'",
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

var query_searchSnippetByCode = function (params, onSuccess, onError) {
    
    var next = function () {

        var query = new tedious.Request(
            "SELECT dbo.Snippets.Id, dbo.Snippets.[Version], dbo.Snippets.JsonPayload, dbo.Snippets.Name, dbo.Snippets.[Description], dbo.Snippets.Tags " +
            "FROM dbo.Snippets INNER JOIN " +
            "( " +
            "    SELECT Id, MAX(Version) AS Version " +
            "    FROM dbo.Snippets " +
            "    WHERE CONTAINS(JsonPayload, \'\"" + params["terms"] + "\"\') " +
            "    GROUP BY Id" +
            ") subLastVersions " +
            "ON dbo.Snippets.Id = subLastVersions.Id " +
            "WHERE dbo.Snippets.[Version] = subLastVersions.[Version] " +
            "ORDER BY dbo.Snippets.Id " +
            "OFFSET " + params["page"] * params["pageSize"] + " ROWS FETCH NEXT " + params["pageSize"] + " ROWS ONLY;",
            function (err, rowCount, rows) {
                if (err) {
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
    tediousService.on('connect', function (err) {
        if (err) onError(err);
        else next();
    });
};
var query_searchSnippetByName = function (params, onSuccess, onError) {

    var next = function () {

        var query = new tedious.Request(
            "SELECT dbo.Snippets.Id, dbo.Snippets.[Version], dbo.Snippets.JsonPayload, dbo.Snippets.Name, dbo.Snippets.[Description], dbo.Snippets.Tags " +
            "FROM dbo.Snippets INNER JOIN " +
            "( " +
            "    SELECT Id, MAX(Version) AS Version " +
            "    FROM dbo.Snippets " +
            "    WHERE Name LIKE \'%\"" + params["terms"] + "\"%\' " +
            "       OR [Description] LIKE \'%\"" + params["terms"] + "\"%\' " +
            "    GROUP BY Id " +
            ") subLastVersions " +
            "ON dbo.Snippets.Id = subLastVersions.Id " +
            "WHERE dbo.Snippets.[Version] = subLastVersions.[Version] " +
            "ORDER BY dbo.Snippets.Id " +
            "OFFSET " + params["page"] * params["pageSize"] + " ROWS FETCH NEXT " + params["pageSize"] + " ROWS ONLY;",
            function (err, rowCount, rows) {
                if (err) {
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
    tediousService.on('connect', function (err) {
        if (err) onError(err);
        else next();
    });
};
var query_searchSnippetByTags = function (params, onSuccess, onError) {

    var next = function () {

        var query = new tedious.Request(
            "SELECT dbo.Snippets.Id, dbo.Snippets.[Version], dbo.Snippets.JsonPayload, dbo.Snippets.Name, dbo.Snippets.[Description], dbo.Snippets.Tags " +
            "FROM dbo.Snippets INNER JOIN " +
            "( " +
            "    SELECT Id, MAX(Version) AS Version " +
            "    FROM dbo.Snippets " +
            "    WHERE Tags LIKE \'%\"" + params["terms"] + "\"%\' " +
            "    GROUP BY Id " +
            ") subLastVersions " +
            "ON dbo.Snippets.Id = subLastVersions.Id " +
            "WHERE dbo.Snippets.[Version] = subLastVersions.[Version] " +
            "ORDER BY dbo.Snippets.Id " +
            "OFFSET " + params["page"] * params["pageSize"] + " ROWS FETCH NEXT " + params["pageSize"] + " ROWS ONLY;",
            function (err, rowCount, rows) {
                if (err) {
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
    tediousService.on('connect', function (err) {
        if (err) onError(err);
        else next();
    });
};

var query_countSnippetByCode = function (params, onSuccess, onError) {

    var next = function () {

        var query = new tedious.Request(
            "SELECT COUNT(dbo.Snippets.Id) " +
            "FROM dbo.Snippets INNER JOIN " +
            "( " +
            "    SELECT Id, MAX(Version) AS Version " +
            "    FROM dbo.Snippets " +
            "    WHERE CONTAINS(JsonPayload, \'\"" + params["terms"] + "\"\') " +
            "    GROUP BY Id " +
            ") subLastVersions " +
            "ON dbo.Snippets.Id = subLastVersions.Id " +
            "WHERE dbo.Snippets.[Version] = subLastVersions.[Version] ",
            function (err, rowCount, rows) {
                if (err) {
                    onError(err);
                }
                else {
                    onSuccess({
                        count: rows[0][0]["value"]
                    });
                }
            }
        );
        tediousService.execSql(query);
    };

    tediousService = new tedious.Connection(connectionConfig);
    tediousService.on('connect', function (err) {
        if (err) onError(err);
        else next();
    });
};
var query_countSnippetByName = function (params, onSuccess, onError) {

    var next = function () {

        var query = new tedious.Request(
            "SELECT COUNT(dbo.Snippets.Id) " +
            "FROM dbo.Snippets INNER JOIN " +
            "( " +
            "    SELECT Id, MAX(Version) AS Version " +
            "    FROM dbo.Snippets " +
            "    WHERE Name LIKE \'%\"" + params["terms"] + "\"%\' " +
            "        OR [Description] LIKE \'%\"" + params["terms"] + "\"%\' " +
            "    GROUP BY Id " +
            ") subLastVersions " +
            "ON dbo.Snippets.Id = subLastVersions.Id " +
            "WHERE dbo.Snippets.[Version] = subLastVersions.[Version] ",
            function (err, rowCount, rows) {
                if (err) {
                    onError(err);
                }
                else {
                    onSuccess({
                        count: rows[0][0]["value"]
                    });
                }
            }
        );
        tediousService.execSql(query);
    };

    tediousService = new tedious.Connection(connectionConfig);
    tediousService.on('connect', function (err) {
        if (err) onError(err);
        else next();
    });
};
var query_countSnippetByTags = function (params, onSuccess, onError) {

    var next = function () {

        var query = new tedious.Request(
            "SELECT COUNT(dbo.Snippets.Id) " +
            "FROM dbo.Snippets INNER JOIN " +
            "( " +
            "    SELECT Id, MAX(Version) AS Version " +
            "    FROM dbo.Snippets " +
            "    WHERE Tags LIKE \'%\"" + params["terms"] + "\"%\' " +
            "    GROUP BY Id " +
            ") subLastVersions " +
            "ON dbo.Snippets.Id = subLastVersions.Id " +
            "WHERE dbo.Snippets.[Version] = subLastVersions.[Version] ",
            function (err, rowCount, rows) {
                if (err) {
                    onError(err);
                }
                else {
                    onSuccess({
                        count: rows[0][0]["value"]
                    });
                }
            }
        );
        tediousService.execSql(query);
    };

    tediousService = new tedious.Connection(connectionConfig);
    tediousService.on('connect', function (err) {
        if (err) onError(err);
        else next();
    });
};



var query = function (query, params, onSuccess, onError) {

    switch(query) {

        case "saveSnippetNew":
            query_saveSnippetNew(params, onSuccess, onError);
            break;

        case "saveSnippetById":
            query_saveSnippetById(params, onSuccess, onError);
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
        case "countSnippetByCode":
            query_countSnippetByCode(params, onSuccess, onError);
            break;

        case "searchSnippetByName":
            query_searchSnippetByName(params, onSuccess, onError);
            break;
        case "countSnippetByName":
            query_countSnippetByName(params, onSuccess, onError);
            break;

        case "searchSnippetByTags":
            query_searchSnippetByTags(params, onSuccess, onError);
            break;
        case "countSnippetByTags":
            query_countSnippetByTags(params, onSuccess, onError);
            break;


        default:
            break;
    }
};

module.exports = {
    query: query
};