/*jshint esversion: 8 */
const express = require("express");
const fetch = require("node-fetch");

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
    console.log(payload);
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
    var data = {
        "document": {
            "content": textStream,
            "type": "PLAIN_TEXT"
        },
        "encodingType": "UTF8"
    };
    var that = this;

    console.log(JSON.stringify(data));
    request.post("https://language.googleapis.com/v1/documents:analyzeSentiment?fields=documentSentiment&key={apiKey}", {
        json: data
    }, function (err, res, body) {
        if (err) {
            console.log(err);
        }
        console.log(body.documentSentiment.score);
        // socket implementation
        io.emit("dataStream",body.documentSentiment);
    });
}
