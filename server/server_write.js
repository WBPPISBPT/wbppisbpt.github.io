//var port = 443;
var port = 8080;

// DB Connection URL
var url = 'mongodb://localhost:27017/test1';

var http = require('http'); // server access.
var filesystem = require('fs'); // file system access.
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var renderDB;
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');

app.set('port', process.env.PORT || port);
app.use(bodyParser.json({limit: '1000mb'}));// to support JSON-encoded bodies
app.use(bodyParser.urlencoded({limit: '1000mb', extended: true}));// to support URL-encoded bodies 

// Use connect method to connect to the server
MongoClient.connect(url, function (err, db) {
    assert.equal(null, err);
    console.log("Connected successfully to Mongo server");

    renderDB = db;
});

app.post('/close', function (request, response) {
    renderDB.close();

    response.writeHead(201, {
        'Content-Type': 'text/plain'
    });
    response.end('Closing the database.');
});

app.post('/init', function (request, response) {
    //renderDB.Images.drop();
    //renderDB.LightPaths.drop();
    
    console.log('mongo db init');
    
    var collections = renderDB.listCollections();
    collections.forEach(function(d) {
        console.log(d.name);
        renderDB.collection(d.name).drop();
    })

    response.writeHead(201, {
        'Content-Type': 'text/plain'
    });
    response.end('Initialized the database.');
});

app.post('/addToCollection/:collectionName', function (request, response) {
    var collectionName = request.params.collectionName;
    
    //console.log('POST addToCollection ' + collectionName);
    console.log(request.body);

    var collection = renderDB.collection(collectionName);
    collection.insert(request.body);

    response.writeHead(201, {
        'Content-Type': 'text/plain'
    });
    response.end('Added entries to collection ' + collectionName + '.');
});

app.post('/', function (request, response) {
    //console.log(request.body);

    response.writeHead(201, {
        'Content-Type': 'text/plain'
    });
    response.end('Post nothing');
});

app.get('/', function (request, response) {
    response.writeHead(200, {
        'Content-Type': 'text/plain'
    });
    response.end('Get nothing');
});

//http.createServer(handle_request).listen(port);
http.createServer(app).listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});