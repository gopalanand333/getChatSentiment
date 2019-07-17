/*jshint esversion: 8 */
const express = require("express");
const mysql = require("mysql");
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
    var payload = req.body.message;
    var user = req.body.user;
    console.log(payload);
    analyzeSentimentData(payload,user);
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
function analyzeSentimentData(textStream,user) {
    var data = {
        "document": {
            "content": textStream,
            "type": "PLAIN_TEXT"
        },
        "encodingType": "UTF8"
    };
    var that = this;
    var userType = user;
    console.log(JSON.stringify(data));
    request.post("https://language.googleapis.com/v1/documents:analyzeSentiment?fields=documentSentiment&key=AIzaSyDo0khXTawz5tUGoKvelmGTI8AOiUrH3EM", {
        json: data
    }, function (err, res, body) {
        if (err) {
            console.log(err);
        }
        console.log(body);
        console.log(body.documentSentiment.score);
        // store to db
        storeToDatabase(body.documentSentiment, userType);
        // socket implementation
        io.emit("dataStream",body.documentSentiment);
    });
}
/////Database storage part
const conn = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "sentiment"
});
function storeToDatabase(dataStream,userType){
    conn.connect((err)=>{
        if(err){
            console.log(err);
        }
        console.log(dataStream);
        var date = new Date().toISOString();
        var query = "INSERT INTO sentiment.sentimentstore(score,magnitude,user) VALUES("+ dataStream.score + ","+ dataStream.magnitude +", \""+ userType +"\")";
        console.log(query);
        conn.query(query,(err,result)=>{
            if(err){
                console.log(err);
            }
            console.log("inserted");
        
        });
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
        var query= "SELECT * FROM sentiment.sentimentstore order by timestamp desc limit 10";
        conn.query(query,(err,result)=>{
            if(err){
                reject(err);
            }else{
                var d=[];
                var obj={};
                for(var i=0;i<result.length;i++){
                    obj = {};
                    obj.day= i;
                    obj.score = result[i].score;
                    obj.user = result[i].user;
                    obj.date = result[i].timestamp;
                    d.push(obj);
                }
                resolve(d);
            }
        });
    });
}
// function getAggregateByUser(){
//     return new Promise((resolve,reject)=>{
//           var data;
//         var query= "SELECT * FROM sentiment.sentimentstore";
//         conn.query(query,(err,result)=>{
//             if(err){
//                 reject(err);
//             }else{
//                 var d=[];
//                 var obj={};
//                 for(var i=0;i<result.length;i++){
//                     obj = {};
//                     obj.day= i;
//                     obj.user = result[i].user;
//                     obj.score = result[i].score;
//                     d.push(obj);
//                 }
//                 resolve(d);
//             }
//         });
//     });
// }
function getDbData(){
    return new Promise((resolve,reject)=>{
        var data;
        var query= "SELECT * FROM sentiment.sentimentstore";
        conn.query(query,(err,result)=>{
            if(err){
                reject(err);
            }else{
                var d=[];
                var obj={};
                for(var i=0;i<result.length;i++){
                    obj = {};
                    obj.day= i;
                    obj.user = result[i].user;
                    obj.score = result[i].score;
                    d.push(obj);
                }
                resolve(d);
            }
        });
    });
}