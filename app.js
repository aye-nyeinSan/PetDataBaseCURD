const mysql = require("mysql2");
const express = require ("express");
const bodyParser = require ("body-parser");
const qbRoutes = require("./routes/qb");

const app = express();

app.use(bodyParser.json());
app.use(qbRoutes);

app.listen(4000);