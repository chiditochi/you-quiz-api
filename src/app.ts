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
import { getLogger, EmailMessageOptions } from './modules/utility';
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
//Logger.warn(path.join(__dirname, "assets"))
// create http server
let server = http.createServer(app);
// connect to db
DB(app)
//.then(db => Logger.log('connnected to db')).catch(e => Logger.error('Error connecting to db'))


AppEvents(app);
AppACL(app);
const appRoutes = AppRoutes(app)

app.use('/api',
    app.appACL.populateCurrentUser,
    appRoutes);

// listen on port
server.listen(APP_PORT, () => {
    app.appLogger.log(`${APP_NAME} App is running on port ${APP_PORT}`)

    const opt: EmailMessageOptions = {
        subject: `${APP_NAME} APP`,
        to: ['chiditochi@yahoo.com', 'alasoharriet06@gmail.com'],
        text: `
        Dear Google,
        This email was sent from the ${APP_NAME} app.
        Please let all know that Harriet is a darling.
        I love her always.
        Kisses and bear hugs

        Regards
        `,
        attachment: [{
            path: path.join(__dirname, "assets", "you-quiz-question-template.xlsx"),
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            name: `${APP_NAME}-Template.xlsx`
        }]
    };
    //app.appEvents.emit('sendEmail', opt);
})

process
    .on('unhandledRejection', (reason, p) => {
        app.appLogger.error(reason + 'Unhandled Rejection at Promise' + p);
    })
    .on('uncaughtException', err => {
        app.appLogger.error(err.message);
        process.exit(1);
    });




