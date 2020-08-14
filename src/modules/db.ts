import { Application } from "express";
import { Connection, Mongoose } from "mongoose";
import { IUser, IUserRole, ICategory, ITest, IQuestion, ITestResult } from "./utility";
import UserSchema from "./users/model";
import UserRoleSchema from "./userRoles/model";
import CategoriesSchema from "./categories/model";
import { Logger } from '../app';
import TestSchema from './tests/model';
import QuestionSchema from './questions/model';
import TestResultSchema from './testResults/model';

const {
    MONGO_USERNAME,
    MONGO_PASSWORD,
    MONGO_HOSTNAME,
    MONGO_PORT,
    MONGO_DB,
    APP_DOCKER_BUILD
} = process.env;


export default async function DB(app: Application) {
    let mongoose = new Mongoose();
    // mongodb://localhost:27017/you-site
    let appDBURI = '';

    if (APP_DOCKER_BUILD == 'true') {
        appDBURI = (MONGO_USERNAME && MONGO_PASSWORD) ?
            `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@mongo:${MONGO_PORT}/${MONGO_DB}`
            : `mongodb://mongo:${MONGO_PORT}/${MONGO_DB}`;
    } else {
        appDBURI = (MONGO_USERNAME && MONGO_PASSWORD) ?
            `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOSTNAME}:${MONGO_PORT}/${MONGO_DB}`
            : `mongodb://${MONGO_HOSTNAME}:${MONGO_PORT}/${MONGO_DB}`;
    }
    Logger.info(`DB appURI: ${appDBURI}`);
    mongoose.connection.on('connected', () => {
        Logger.log(`connected to ${MONGO_DB} Database`)

        mongoose.connection.model<IUser>('User', UserSchema);
        mongoose.connection.model<IUserRole>('UserRole', UserRoleSchema);
        mongoose.connection.model<ICategory>('Category', CategoriesSchema);
        mongoose.connection.model<ITest>('Test', TestSchema);
        mongoose.connection.model<IQuestion>('Question', QuestionSchema);
        mongoose.connection.model<ITestResult>('TestResult', TestResultSchema);

        app.appEvents.emit("createAdminUser");
    })

    mongoose.connect(appDBURI, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true });
    app.appDB = mongoose.connection;

    // const db = await mongoose.createConnection(appDBURI, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true });
    // app.appDB = db;

};


