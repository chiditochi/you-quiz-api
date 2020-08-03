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
import path from 'path';
import { getLogger } from './modules/utility';
import morgan from 'morgan';
import { AppRoutes } from './modules/routes';
import DB from './modules/db';
import AppEvents from './modules/appEvents';
import { Connection } from 'mongoose';
import AppACL from './modules/acl';


// create app
let app = express();

/* app configuration */
// app Logger
export const Logger = getLogger(`${APP_NAME}`);
app.appLogger = Logger;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('short'))
app.use(express.static(path.join(__dirname, "assets")));

// create http server
let server = http.createServer(app);
// connect to db
DB(app)


AppEvents(app);
AppACL(app);
const appRoutes = AppRoutes(app)

app.use('/api',
    app.appACL.populateCurrentUser, 
    appRoutes);


// listen on port
server.listen(3001, () => {
    app.appLogger.log(`${APP_NAME} App is running on port ${APP_PORT}`)

})


process
    .on('unhandledRejection', (reason, p) => {
        app.appLogger.error(reason + 'Unhandled Rejection at Promise' + p);
    })
    .on('uncaughtException', err => {
        app.appLogger.error(err.message);
        process.exit(1);
    });




