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
var queryString = require('query-string');

app.set('port', process.env.PORT || port);
app.use(bodyParser.json({limit: '1000mb'}));// to support JSON-encoded bodies
app.use(bodyParser.urlencoded({limit: '1000mb', extended: true}));// to support URL-encoded bodies 

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

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

app.get('/getOriginalCameraPathsByPixel', function (request, response) {
    var collectionName = 'OriginalCameraPaths';
    
    var query = JSON.parse(request.query.query_string);
    
    console.log(query)
    
    var collection = renderDB.collection(collectionName);
    collection.find(query).toArray(function (err, docs) {
        console.log("retrieved records:");
        console.log(docs);
        response.json(docs);
    });
});

app.get('/getFromCollection/:collectionName', function (request, response) {
    // A generic Get routine. Queries must be well-formed.
    
    var collectionName = request.params.collectionName;
    var query = JSON.parse(request.query.query_string);
    
    // This works when we stringify the query before sending with AJAX,
    // otherwise numerical values will get converted to strings and the
    // query on the collection will fail.
    
    console.log('Get from collection ' + collectionName + '.');
    console.log(query)
    
    var collection = renderDB.collection(collectionName);
    collection.find(query).toArray(function (err, docs) {
        console.log("retrieved records:");
        console.log(docs);
        response.json(docs);
    });
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