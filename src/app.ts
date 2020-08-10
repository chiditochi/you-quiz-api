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
import { getLogger, EmailMessageOptions, addDaysToDate } from './modules/utility';
import morgan from 'morgan';
import { AppRoutes } from './modules/routes';
import DB from './modules/db';
import AppEvents from './modules/appEvents';
import { Connection } from 'mongoose';
import AppACL from './modules/acl';
//import './assets/data/you-quiz-question-template.xlsx'

// create app
let app = express();

/* app configuration */
// app Logger
export const Logger = getLogger(`${APP_NAME}`);
app.appLogger = Logger;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('short'))
//Logger.log(__dirname)
app.use(express.static(path.join(__dirname, "assets")));
//Logger.warn(path.join(__dirname, "assets"))


// create http server
let server = http.createServer(app);
// connect to db
DB(app)
//.then(db => Logger.log('connnected to db')).catch(e => Logger.error('Error connecting to db'))

//Logger.log(addDaysToDate( new Date(), 7).toString())


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
        text: "",
        html: `
        Dear Lord, <br/>
        You are God and will always be<br/>
        Lord bless and give Harriet and I peace.<br/>
        Hear our prayers this day.<br/>
        Amen!
        `,
        attachment: [{
            path: path.join(__dirname, 'assets', 'you-quiz-question-template.xlsx'),
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




