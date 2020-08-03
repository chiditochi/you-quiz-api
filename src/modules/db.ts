import { Application } from "express";
import { Connection, Mongoose } from "mongoose";
import { IUser, IUserRole, ICategory } from "./utility";
import UserSchema from "./users/model";
import UserRoleSchema from "./userRoles/model";
import CategoriesSchema from "./categories/model";
import { Logger } from '../app';

const {
    MONGO_USERNAME,
    MONGO_PASSWORD,
    MONGO_HOSTNAME,
    MONGO_PORT,
    MONGO_DB,
    APP_DOCKER_BUILD
} = process.env;

// async function getDBConnection(url: string, options: {}): Promise<Connection> {
//     const mongoose = require('mongoose');
//     let db = await mongoose.createConnection(url, options)
//     return db;
// }

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
        app.appEvents.emit("createAdminUser");
    })

    mongoose.connect(appDBURI, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true });
    app.appDB = mongoose.connection;

};


