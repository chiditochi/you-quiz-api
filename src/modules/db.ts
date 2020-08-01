import { Application } from "express";
import { Mongoose, Connection } from "mongoose";
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
    MONGO_DB
  } = process.env;

// export default async function DBs() {
//     const mongoose = new Mongoose();
//     // mongodb://localhost:27017/you-site
//     const appDBURI =  (MONGO_USERNAME && MONGO_PASSWORD)? 
//         `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOSTNAME}:${MONGO_PORT}/${MONGO_DB}`
//         :`mongodb://${MONGO_HOSTNAME}:${MONGO_PORT}/${MONGO_DB}`;
//     try {
//         return mongoose
//         .createConnection(appDBURI, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true})
//         .then(db=>{
//             Logger.warn(`Successfully connected to ${MONGO_DB} database`)
    
//             // impport and register mongoose models here
//             db.model<IUser>('User', UserSchema)
//             db.model<IUserRole>('UserRole', UserRoleSchema)
//             db.model<ICategory>('Category', CategoriesSchema)
//             return db;
//         }).catch(e=>{ throw new Error(e)})    


//         //return app.appDB = db;
//         //app.set("appDB", db);

//     } catch (e) {
//         Logger.error("Connection to database failed", e.message)
//         throw new Error("Database Connection failed ...")
//     }

// };

export default async function DB(app: Application) {

    const mongoose = new Mongoose();
    // mongodb://localhost:27017/you-site
    const appDBURI =  (MONGO_USERNAME && MONGO_PASSWORD)? 
        `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOSTNAME}:${MONGO_PORT}/${MONGO_DB}`
        :`mongodb://${MONGO_HOSTNAME}:${MONGO_PORT}/${MONGO_DB}`;

    const db = mongoose.createConnection(appDBURI, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true });

    db.model<IUser>('User', UserSchema)
    db.model<IUserRole>('UserRole', UserRoleSchema)
    db.model<ICategory>('Category', CategoriesSchema)




    mongoose.connection.on('error', () => {
        Logger.error("Connection to database failed")
    })
    mongoose.connection.on('connect', () => {
        Logger.warn(`Successfully connected to ${MONGO_DB} database`)
    })

     app.appDB = db;
    // return db;

};