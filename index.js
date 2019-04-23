/*jshint esversion: 6 */
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const port = process.env.PORT || 8080;
app.use(bodyParser.json());// support encoded json bodies
app.use(bodyParser.urlencoded({extended: true}));// supports encoded bodies

// Post port http://localhost:8090/analyzeSentiment
app.post("/analyzeSentiment", (req,res)=>{
    var payload = req.body.message;
    console.log(payload);
    res.status(200).send("sent for sentiment analysis");
});
app.get("/test",(req,res)=>{
    res.send("hahaah");
});
app.listen(port,()=>{
    console.log("App is listening to port :-"+ port);
});
