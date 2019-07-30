/*jshint esversion: 8 */
const express = require("express");
const Pool = require("pg").Pool;
const dotenv = require("dotenv");
dotenv.config();
var pgConfig;
// postgres database configuration
var config = {
    environment: process.env.NODE_ENV,
    port: process.env.port,
    username: process.env.localUser,
    password: process.env.localPassword,
    dbname: process.env.dbname,
    hostname: process.env.hostname
};
if (config.environment !== "development") {
    dbConfiguration = JSON.parse(process.env.VCAP_SERVICES);
    pgConfig = {
        host: databaseConfiguration.postgresql[0].credentials.hostname,
        database: databaseConfiguration.postgresql[0].credentials.dbname,
        user: databaseConfiguration.postgresql[0].credentials.username,
        password: databaseConfiguration.postgresql[0].credentials.password,
        port: databaseConfiguration.postgresql[0].credentials.port
    };
} else {
    pgConfig = {
        host: config.hostname,
        database: config.dbname,
        user: config.username,
        password: config.password,
        port: config.pgport
    };
}
var Conn = new Pool({
    user : pgConfig.user,
    host: pgConfig.host,
    database: pgConfig.database,
    password: pgConfig.password,
    port : pgConfig.port
});

// Imports the Google Cloud client library
const language = require('@google-cloud/language');
const request = require("request");
// Instantiates a client
const client = new language.LanguageServiceClient();
const app = express();
//const server = require("http").Server(app);

var streamData = [];
const bodyParser = require("body-parser");
const port = process.env.PORT || 8088;
const server = app.listen(port);
const io = require("socket.io").listen(server);
app.use(bodyParser.json()); // support encoded json bodies
app.use(bodyParser.urlencoded({
    extended: true
})); // supports encoded bodies
//use html page
app.use(express.static(__dirname + "/charts"));
// Post port http://localhost:8090/analyzeSentiment
app.post("/analyzeSentiment", (req, res) => {
    var payload = req.body;
    console.log("payload", payload);
    analyzeSentimentData(payload);
    res.status(200).send("sent for sentiment analysis");
});
app.get("/getData", (req, res) => {
    console.log(streamData);
    res.send(streamData);
});
// server.listen(port, () => {
//     console.log("App is listening to port :-" + port);
// });


io.on("connection", function(socket){
    console.log("connection established");
    socket.on("disconnect",function(){
        console.log("disconnected");
    });
  
});
// function to call google apis for sentiment analysis
function analyzeSentimentData(textStream) {
    console.log(textStream);
    var text =textStream;
console.log("text",text);
    var data = {
        "document": {
            "content": textStream.text,
            "type": "PLAIN_TEXT"
        },
        "encodingType": "UTF8"
    };
    var that = this;
    var userType = textStream;
    console.log(JSON.stringify(data));
    request.post("https://language.googleapis.com/v1/documents:analyzeSentiment?fields=documentSentiment&key=AIzaSyCKhJRvB92xo_TPMUa3cQVkVp7bE6KRwhQ", {
        json: data
    }, function (err, res, body) {
        if (err) {
            console.log(err);
        }
        console.log(body);
        console.log(body.documentSentiment);
        // store to db
        storeToDatabase(body.documentSentiment, userType);
        // socket implementation
        io.emit("dataStream",body.documentSentiment);
    });
}

function storeToDatabase(dataStream,userType){
        var date = new Date().toISOString();
        var query = "INSERT INTO sentimentstore( score, magnitude, processor,component, "/timestamp/") VALUES("/ + dataStream.score + "," + dataStream.magnitude + ", \"" + userType.processor + "\", \"" + userType.component + "\" "  + timestamp +" )";
        console.log(query);
        Conn.connection.query(query,(err,result)=>{
            if(err){
                console.log(err);
            }
            console.log("inserted");
        });
}
/// get db data api
app.get("/getDbData",(req,res)=>{
var data = getDbData();
data.then((result)=>{
    res.send(result).status(200);
},(err)=>{
    res.send(err).status(500);
});
});
app.get("/getRecentData",(req,res)=>{
    var data = getRecentData();
    data.then((result)=>{
        res.send(result).status(200);
    },(err)=>{
        res.send(err).status(500);
    });
});
function getRecentData(){
    return new Promise((resolve,reject)=>{
        var data;
        var query= "SELECT * FROM sentimentstore order by timestamp desc limit 50";
        Conn.query(query,(err,result)=>{
            if(err){
                console.log(err);
                reject(err);
            }else{
                console.log(result);
                var d=[];
                var obj={};
                for(var i=0;i<result.rows.length;i++){
                    obj = {};
                    obj.day= i;
                    obj.score = result.rows[i].score;
                    obj.user = result.rows[i].user;
                    obj.component = result.rows[i].component;
                    obj.date = result.rows[i].timestamp;
                    d.push(obj);
                }
                resolve(d);
            }
        });
    });
}
function getDbData(){
    return new Promise((resolve,reject)=>{
        var data;
        var query= "SELECT * FROM sentiment.sentimentstore";
        Conn.query(query,(err,result)=>{
            if(err){
                reject(err);
            }else{
                var d=[];
                var obj={};
                for(var i=0;i<result.rows.length;i++){
                    obj = {};
                    obj.day= i;
                    obj.user = result.rows[i].user;
                    obj.score = result.rows[i].score;
                    d.push(obj);
                }
                resolve(d);
            }
        });
    });
}