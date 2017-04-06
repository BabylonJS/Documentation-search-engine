var snippetApiBaseUrl = "http://babylonjs-api2.azurewebsites.net/snippets/";
var statusMessageGet = document.getElementById('statusMessageGet');
var statusMessagePost = document.getElementById('statusMessagePost');
// function onSaveNewSnippetClick() {
//     var json = document.getElementById("nameSnippet").value;
//     json += document.getElementById("descSnippet").value;
//     json += document.getElementById("tagSnippet").value;
//     json += document.getElementById("payloadSnippet").value;
//     var jsonObject = JSON.parse(json);
//     var existingId = document.getElementById("existingId").value;

//     var url = snippetApiBaseUrl + "snippet";

//     if (existingId != "") {
//         url += "/" + existingId;
//     }

//     var xmlHttp = new XMLHttpRequest();
//     xmlHttp.onreadystatechange = function () {
//         if (xmlHttp.readyState == 4) {
//             switch (xmlHttp.status) {
//                 case 201:
//                     var snippet = JSON.parse(xmlHttp.responseText);
//                     var snippetUrl = url + "/" + snippet.id;
//                     if (snippet.version != "0") {
//                         snippetUrl += "/" + snippet.version;
//                     }
//                     document.getElementById("snippetUrl").value = snippetUrl;

//                 case 204:
//                     console.warn('No content');
//                     break;
//                 case 400:
//                     console.error('Bad request');
//                     break;
//                 case 401:
//                     console.error('Unauthorized');
//                     break;
//                 case 404:
//                     console.error('Not found');
//                     break;
//                 case 500:
//                     console.error('Internal server error');
//                     break;
//             }
//         }
//     }

//     var jsonAsString = JSON.stringify(jsonObject);
//     xmlHttp.open("POST", url, true);
//     xmlHttp.setRequestHeader("Content-Type", "application/json");
//     xmlHttp.send(jsonAsString);
// }

function onGetSnippetClick() {
    var url = snippetApiBaseUrl + document.getElementById("snippetUrl").value;
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4) {
            switch (xmlHttp.status) {
                case 200:
                    var jsonObject = JSON.parse(xmlHttp.responseText);
                    alert(xmlHttp.responseText);
                    break;
                case 204:
                    statusMessageGet.innerText = 'No content';
                    console.warn('No content');
                    break;
                case 400:
                    statusMessageGet.innerText = 'Bad request';
                    console.error('Bad request');
                    break;
                case 401:
                    statusMessageGet.innerText = 'Unauthorized';
                    console.error('Unauthorized');
                    break;
                case 404:
                    statusMessageGet.innerText = 'Not found';
                    console.error('Not found');
                    break;
                case 500:
                    console.error('Internal server error');
                    break;
            }
        }
    }

    xmlHttp.open("GET", url, true);
    xmlHttp.setRequestHeader('Access-Control-Allow-Origin', '*');
    xmlHttp.send();
}

function onSearchSnippetClick(searchType) {
    document.getElementById('numberResults').innerText = 'Counting results...';
    //numberSnippets = 0;
    var url = snippetApiBaseUrl + "search";
    switch (searchType) {
        case 'snippetSearchDesc':
            url += '/name';
            break;
        case 'snippetSearchTag':
            url += '/tags';
            break;
        case 'snippetSearchCode':
            url += '/code/';
            break;
    }

    var xmlHttpNumber = new XMLHttpRequest();
    xmlHttpNumber.onreadystatechange = function () {
        if (xmlHttpNumber.readyState == 4) {
            switch (xmlHttpNumber.status) {
                case 200:
                    var searchResponse = JSON.parse(xmlHttpNumber.responseText);
                    document.getElementById('numberResults').innerText = searchResponse.count + ' results';

                    break;
                case 204:
                    console.warn('No content');
                    break;
                case 400:
                    console.error('Bad request');
                    break;
                case 401:
                    console.error('Unauthorized');
                    break;
                case 404:
                    console.error('Not found');
                    break;
                case 500:
                    console.error('Internal server error');
                    break;
            }
        }
    }
    document.getElementById("searchResults").value = "";

    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4) {
            switch (xmlHttp.status) {
                case 200:
                    var searchResponse = JSON.parse(xmlHttp.responseText);

                    for (var snippetIndex of searchResponse) {
                        //numberSnippets++;
                        document.getElementById("searchResults").value += (snippetIndex.id + "\r\n");
                    }
                    break;
                case 204:
                    console.warn('No content');
                    break;
                case 400:
                    console.error('Bad request');
                    break;
                case 401:
                    console.error('Unauthorized');
                    break;
                case 404:
                    console.error('Not found');
                    break;
                case 500:
                    console.error('Internal server error');
                    break;
            }
            xmlHttpNumber.send(JSON.stringify({
                "search": document.getElementById(searchType).value,
            }));
        }
        //document.getElementById('numberResults').innerHTML = numberSnippets + ' results';
    }

    xmlHttp.open("POST", url, true);
    xmlHttp.setRequestHeader('Access-Control-Allow-Origin', '*');
    //Send the proper header information along with the request
    xmlHttp.setRequestHeader("Content-type", "application/json");
    xmlHttp.send(JSON.stringify({
        "search": document.getElementById(searchType).value,
        "page": 0,
        "pageSize": 25,
        "includePayload": false
    }));

    xmlHttpNumber.open("POST", snippetApiBaseUrl + 'count/code', true);
    xmlHttpNumber.setRequestHeader('Access-Control-Allow-Origin', '*');
    //Send the proper header information along with the request
    xmlHttpNumber.setRequestHeader("Content-type", "application/json");
}

//document.getElementById("btnSaveSnippet").addEventListener("click", onSaveNewSnippetClick);
document.getElementById("btnGetSnippet").addEventListener("click", onGetSnippetClick);
document.getElementById("btnSearchSnippetDesc").addEventListener("click", function () { onSearchSnippetClick('snippetSearchDesc') }, true);
document.getElementById("btnSearchSnippetTag").addEventListener("click", function () { onSearchSnippetClick('snippetSearchTag') }, true);
document.getElementById("btnSearchSnippetCode").addEventListener("click", function () { onSearchSnippetClick('snippetSearchCode') }, true);
