require('dotenv').config()
const {
    MONGO_USERNAME,
    MONGO_PASSWORD,
    MONGO_HOSTNAME,
    MONGO_PORT,
    MONGO_DB,
    APP_NAME,
    APP_PORT
  } = process.env;
  
import express from 'express';
import http from 'http';



// create app
let app = express();

// create http server
let server = http.createServer(app);

// listen on port
server.listen(3001, ()=>{
    console.log(`${APP_NAME} App is running on port ${APP_PORT}`)
})






