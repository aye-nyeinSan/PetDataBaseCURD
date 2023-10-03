const express = require("express");
const mysqlConnection = require("../utils/database.js");

const Router = express.Router();
Router.get("/customers",(req,res)=>{
    mysqlConnection.query(
         "SELECT * FROM customer",
         (err,results,fields)=>{
            if(!err){
                res.send(results);
            } else{
                console.log(err);
            }

         }
    )
    
});


module.exports= Router;
