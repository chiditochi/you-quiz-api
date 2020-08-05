import { Application, Request, Response, NextFunction } from 'express'
import config from '../config.json';
import mongoose, { Connection, Document, Mongoose } from 'mongoose'

import { EventEmitter } from 'events';
import * as Utility from './utility';
import { IUser, USERROLE, RequiredUserCreationFields, validateCreationFields, UserLoginFields, getEnumValue, IUserRole, validateCreationDataKeys, validateCreationDataValues, GENDER } from './utility'
import * as jwt from 'jsonwebtoken';

const { APP_SECRET, APP_ADMIN_PASSWORD, APP_EMAIL } = process.env



const AppEvents = function (app: Application) {
    const Logger = app.appLogger;
    const DB: Connection = app.appDB;
    const appEvents = new EventEmitter();
    const userManagement = config.userManagment;


    async function getAdminUser(DB: Connection) {
        const adminUser = await DB.models.User.findOne({ lastName: 'admin' });
        return adminUser ? adminUser._doc : null;
    };

    async function expireToken() {
        // code for expiring token
        return true
    };

    appEvents.on("createAdminUser", async function (): Promise<void> {
        const { GENDER } = Utility;
        try {
            let adminUser = await getAdminUser(DB);
            if (adminUser == null) {
                const configAdminUser = config.app.adminUser;
                const hash = await DB.models.User.schema.statics.hashPassword(APP_ADMIN_PASSWORD)
                    .catch((e: { message: string; }) => { throw new Error("Error hashing Admin password: " + e.message) });
                adminUser = {
                    ...configAdminUser,
                    createdAt: new Date(),
                    gender: GENDER[configAdminUser.gender],
                    password: hash
                };
                const dbAdminUser: IUser[] = await DB.models.User.create([adminUser]).catch(e => { throw new Error("Unable to create Admin user: " + e.message) });
                Logger.warn(`adminUser ${dbAdminUser[0].profile.userName} created! ...`);

                appEvents.emit("userRoles");
                appEvents.emit("Categories");

            } else Logger.warn(`Admin user with userName '${adminUser.profile.userName}' exists`)
        } catch (e) {
            throw new Error("Error creating AdminUser: " + (e.message || e));
        }
    })

    /* populate userRoles if empty */
    appEvents.on("userRoles", async function () {
        try {
            const roleCount: number = await DB.models.UserRole.countDocuments({}).catch(e => { throw new Error("Unable get User Role Count: " + e.message) });
            Logger.warn(`DB UserRole count is ${roleCount}`);
            roleCount === 0 ? await appEvents.emit("addDefaultUserRoles") : null;

        } catch (error) {
            Logger.error(error);
        }
    })

    async function populateAdminRole() {
        try {
            const adminRoleName = getEnumValue(USERROLE, USERROLE.ADMIN);
            const adminRole: IUserRole = await DB.models.UserRole.findOne({ roleName: adminRoleName });
            const adminUserEmail = config.app.adminUser.profile.email;
            const adminUser: IUser = await DB.models.User.findOne({ "profile.email": adminUserEmail });
            adminUser.roles.push(adminRole._id);
            const dbAdminUser = await adminUser.save();
            Logger.warn(`Admin user role updated to ${adminRole.roleName}`)

        } catch (e) {
            Logger.error(`Eror! admin role population failed. ${e.message || e}`);
        }
    }

    appEvents.on("addDefaultUserRoles", async function () {
        const { USERROLE, getEnumList } = Utility;
        const roles = getEnumList(USERROLE);
        try {
            const creator = await getAdminUser(DB);
            const defaultUserRoles = roles.map(r => ({ roleName: r, creator: creator._id }));

            const result: Utility.IUserRole[] = await DB.models.UserRole.insertMany(defaultUserRoles).catch(e => { throw new Error("Error inserting UserRoles: \n" + e.message) });
            Logger.warn(`${result.length} UserRoles inserted ...`);
            await populateAdminRole();
        } catch (e) {
            Logger.error(e.message || e);
        }
    })


    /* populate Categories if empty */
    appEvents.on("Categories", async function () {
        try {
            const portCatCount: number = await DB.models.Category.countDocuments({}).catch(e => { throw new Error("Unable get Portfolio Category Count: " + e.message) });
            Logger.warn(`DB Category count is ${portCatCount}`);
            portCatCount === 0 ? await appEvents.emit("addDefaultCategory") : null;

        } catch (error) {
            Logger.error(error);
        }
    })

    appEvents.on("addDefaultCategory", async function () {
        try {
            const categoryList = config.category;
            const creator = await getAdminUser(DB);
            const defaultCategory = categoryList.map(r => ({ roleName: r, creator: creator._id }))
            const result: Utility.ICategory[] = await DB.models.Category.insertMany(defaultCategory).catch(e => { throw new Error("Error inserting Categories: \n" + e.message) });
            Logger.warn(`${result.length} Categories inserted ...`);

        } catch (e) {
            Logger.error(e.message || e);
        }
    })

    appEvents.on("signupUser", async function (user: RequiredUserCreationFields, req: Request, res: Response) {
        try {
            const requiredFields = ['firstName', 'lastName', 'lastName', 'roles', 'email', 'password'];
            const validateKeys = validateCreationDataKeys(Object.keys(user), requiredFields)
            const validateValues = validateCreationDataValues(user, requiredFields);

            if (validateKeys.length > 0 || validateValues.length > 0) throw new Error(`missing properties: ${validateKeys.length === 0 ? 0 : validateKeys.join(',')} ; invalid values: ${validateValues.length === 0 ? 0 : validateValues.join(',')}`);

            const { firstName, lastName, password, roles, email, gender } = user;

            const roleId: { _id: string } = await DB.models.UserRole
                .findOne({ roleName: getEnumValue(USERROLE, roles) }, { _id: true })
                .catch(() => { throw new Error("Error fetching Admin role" + roleId) });
            Logger.warn(roleId)
            const hash = await DB.models.User.schema.statics.hashPassword(user.password)
                .catch((e: { message: String }) => { throw new Error("Error fetching Admin role" + e.message) });

            let newUser = {
                createdAt: new Date(),
                profile: { email: user.email },
                gender: getEnumValue(GENDER, user.gender),
                roles: [roleId._id],
                firstName: firstName,
                lastName: lastName,
                password: hash
            };

            const userDoc = new DB.models.User(newUser);
            let dbUserDoc: IUser = await userDoc.save().catch((e: any) => { throw e });
            const msg = `User ${dbUserDoc.profile.userName} created! Login with email and password!`;
            const response = { success: true, data: userDoc, message: msg };
            Logger.info(msg);
            res.json(response);

        } catch (e) {
            const message = (e.code === 11000) ? "User already exists" : "Error creating User: " + e.message;
            const status = (e.code === 11000) ? 400 : 500;
            Logger.error(message);
            res.status(status).json({ success: false, data: [], message: message });
        }

    })

    appEvents.on("loginUser", async function (user: UserLoginFields, req: Request, res: Response) {
        try {
            const { email, password } = user;
            const requiredFields = ['email', 'password'];
            const validateKeys = validateCreationDataKeys(Object.keys({ email, password }), requiredFields)
            const validateValues = validateCreationDataValues({ email, password }, requiredFields);

            if (validateKeys.length > 0 || validateValues.length > 0) throw new Error(`missing properties: ${validateKeys.length === 0 ? 0 : validateKeys.join(',')} ; invalid values: ${validateValues.length === 0 ? 0 : validateValues.join(',')}`);

            const query = { 'profile.email': email };
            const dbUser: IUser = await DB.models.User
                .findOne(query)
                .catch(() => { throw new Error(`Error fetching User with email: ${email}`) });
            //if user isActive is false dont allow login
            if (!dbUser.isActive) throw new Error(`Login Failed! You are not Active! Please contact the admin|manager via ${APP_EMAIL}`);
            const isPasswordValid: boolean = await DB.models.User.schema.statics.comparePassword(password, dbUser.password)
                .catch((e: { message: String }) => { throw new Error("Error hashing user's password" + e.message) });

            if (!isPasswordValid) {
                Logger.debug(`Invalid password for user ${user.email}`)
                throw new Error(`Invalid login credentials for user ${user.email}`);
            }
            delete dbUser.password;
            const msg = `Login successful for user: ${user.email}`;
            Logger.info(msg);

            appEvents.emit("generateToken", dbUser, req, res);
        } catch (e) {
            Logger.error(e.message || e);
            res.json({ success: false, data: [], message: e.message || e });
        }
    })

    appEvents.on("logoutUser", async function (user: RequiredUserCreationFields, req: Request) {
        try {
            const userName = req.currentUser as IUser;
            req.currentUser = undefined;
            req.isLoggedIn = false;
            const msg = `User ${userName.profile.userName} logged out!`
            Logger.warn(msg);
            return { success: true, data: {}, message: msg }
        } catch (e) {
            return { success: false, data: [], message: (e.message || e) };
        }

    })

    type JwtSigningResponse = { success: boolean, token?: string, error?: Error }

    async function callJWTSign(payload: { exp: number, data: IUser }, secret: string): Promise<JwtSigningResponse> {
        return new Promise(function (resolve, reject) {
            jwt.sign({ data: payload.data }, secret, { expiresIn: payload.exp }, function (err, token) {
                if (err) reject({ error: err, success: false });
                else return resolve({ success: true, token: token })
            });
        })
    }

    async function callJWTVerify(token: string, secret: string): Promise<string | object> {
        const result = jwt.verify(token, secret)
        return Promise.resolve(result);
    }

    appEvents.on("generateToken", async function (payload, req: Request, res: Response) {
        const tokenPayload = { exp: userManagement.exp, data: payload };
        const result =
            await callJWTSign(tokenPayload, APP_SECRET as string)
                .catch(() => {
                    const msg = `Error generating token for ${payload.email}`
                    Logger.error(msg)
                    res.json({ status: false, message: msg })
                });
        const response = { ...payload._doc, token: (result as JwtSigningResponse).token }
        delete response.password;
        res.json({ status: true, data: response, message: 'Login successful | Token generated!' })
    })

    appEvents.on("verifyToken", async function (token: string, req: Request, res: Response, next: NextFunction) {
        try {
            //Logger.warn(`${APP_SECRET}`)
            const result = await callJWTVerify(token, APP_SECRET as string);
            req.currentUser = result as IUser;
            req.isLoggedIn = Object.keys(result).length ? true : false;
            Logger.info('Current User: ', req.currentUser, req.isLoggedIn)
            next();

        } catch (e) {
            Logger.error(e.message || e)
            req.currentUser = undefined;
            req.isLoggedIn = false;
            Logger.error('Current User: ', req.currentUser, req.isLoggedIn)
            next();
        }
    })

    // app.set("AppEvents", appEvents);
    app.appEvents = appEvents
};

export default AppEvents;