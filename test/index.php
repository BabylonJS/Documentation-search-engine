<!DOCTYPE html>
<html>

<head>
    <title> Babylon Snippet Test API </title>
    <meta charset="UTF-8">
</head>

<body>
    <!--<h1> Save a new snippet </h1>
    <p> Enter your JSON snippet</p>
    <textarea placeholder="Name" rows="3" cols="50" id="nameSnippet"></textarea><br>
    <textarea placeholder="Description" rows="3" cols="50" id="descSnippet"></textarea><br>
    <textarea placeholder="Tag1; Tag2; Tag3; ..." rows="3" cols="50" id="tagSnippet"></textarea><br>
    <textarea placeholder="Payload" rows="3" cols="50" id="payloadSnippet"></textarea><br>
    <p> Update existing ?
        <input type="text" id="existingId">
    </p>
    <p>
        <input type="button" id="btnSaveSnippet" value="Save">
    </p>
    <hr>-->
    <h1 style="margin-top:100px;"> Get a snippet </h1>
    <p>
        <input type="text" id="snippetUrl" style="width: 500px">
        <input type="button" value="GET" id="btnGetSnippet">
    </p>
    <p id="statusMessageGet">
    </p>
    <p id="snippetValue"></p>
    <hr>
    <h1> Search for snippets </h1>
    <p>
        <input type="text" placeholder="Search in Titles / Description" id="snippetSearchDesc" style="width: 500px">
        <input type="button" value="SEARCH" id="btnSearchSnippetDesc">
    </p>
    <p>
        <input type="text" placeholder="Search in Tags" id="snippetSearchTag" style="width: 500px">
        <input type="button" value="SEARCH" id="btnSearchSnippetTag">
    </p>
    <p>
        <input type="text" placeholder="Search in Code" id="snippetSearchCode" style="width: 500px">
        <input type="button" value="SEARCH" id="btnSearchSnippetCode">
    </p>
    <p id="statusMessagePost">
    </p>
    <textarea id="searchResults" style="height: 500px; width: 1000px;" readonly="readonly"></textarea>
</body>

<script type="text/javascript" src="js/getResults.js"></script> 

</html>