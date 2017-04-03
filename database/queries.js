var azureStorage = require('azure-storage');
var crypto = require("crypto");


// ***************************** DATABASE CONNECTION INFOS *****************************

var azureStorageAccount = process.env.AZURE_STORAGE_ACCOUNT || config.database.AZURE_STORAGE_ACCOUNT;
var azureStorageAccessKey = process.env.AZURE_STORAGE_ACCESS_KEY || config.database.AZURE_STORAGE_ACCESS_KEY;
var tableService = azureStorage.createTableService(azureStorageAccount,azureStorageAccessKey);


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


// ***************************** SAVE *****************************

var query_saveSnippetNew = function(params, onSuccess, onError) {

    var uniqueId = "";

    // TODO : Check that this unique ID is not already inserted!
    do {
        uniqueId = randomID();
    }while(uniqueId == "");

    var entGen = azureStorage.TableUtilities.entityGenerator;
    var task = {
        PartitionKey: entGen.String(uniqueId),
        RowKey      : entGen.String('0'),
        JsonPayload : entGen.String(params['JsonPayload']),
        Name        : entGen.String(params['Name']),
        Description : entGen.String(params['Description']),
        Tags        : entGen.String(params['Tags'])
    };

    tableService.insertEntity('snippets', task, {echoContent: true}, function(error, result, response) {
        if(!error) {
            console.log(result);
            onSuccess(result);
        }
        else {
            console.log(error);
            onError(error);
        }
    });
};
var query_saveSnippetById = function(params, onSuccess, onError) {

};


// ***************************** GET *****************************

var query_getSnippetById = function(params, onSuccess, onError) {

    var azureQuery = new azureStorage.TableQuery()
        .where('PartitionKey eq ?', params['id']);

    tableService.queryEntities('snippets', azureQuery, null, function(error, queryResults, response) {
        if(!error) {
            var result = null;
            var max = -1;
            queryResults.entries.forEach(function (snippet) {
                if(snippet.RowKey._ > max) {
                    max = snippet.RowKey._;
                    result = snippet;
                }
            });

            if(result != null) onSuccess(parseResult(result));
            else onSuccess(null);
        }
        else {
            onError(error);
        }
    });
};
var query_getSnippetByIdAndVersion = function(params, onSuccess, onError) {

    var azureQuery = new azureStorage.TableQuery()
        .where('PartitionKey eq ?', params['id'])
        .and('RowKey eq ?', params['version']);

    tableService.queryEntities('snippets', azureQuery, null, function(error, queryResults, response) {
        if(!error) {
            var result = queryResults.entries[0];

            if(result != null) onSuccess(parseResult(result));
            else onSuccess(null);
        }
        else {
            onError(error);
        }
    });
};


// ***************************** SEARCH *****************************

var query_searchSnippetByCode = function(params, onSuccess, onError) {};
var query_searchSnippetByName = function(params, onSuccess, onError) {};
var query_searchSnippetByTags = function(params, onSuccess, onError) {};




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