import { Application, Request, Response } from "express";
import { IUser, ITest, getRequiredUserCreationFields, validateCreationDataKeys, getEnumValue, GENDER, USERROLE, IUserRole, UPDATETYPE } from './../utility';
import UserSchema from './model';


export default function UserController(app: Application) {
    const Logger = app.appLogger;
    const DB = app.appDB;

    const getUsers = async function (req: Request, res: Response) {
        try {
            const users: IUser[] = await DB.models.User.find({}).populate('roles', { roleName: 1, creator: 1 });
            return res.json({ message: "all users", data: users });
        } catch (e) {
            Logger.error(`Error fetching users, ${e.message || e}`)
            res.json({ message: e.message || e, data: [] })
        }

    }
    const getUser = async function (req: Request, res: Response) {
        try {
            const { id } = req.params;
            if (!id) throw new Error(`Please provide user id`);
            const user: IUser[] = await DB.models.User.find({ _id: id }).populate('roles', { roleName: 1, creator: 1 });
            return res.json({ message: user.length > 0 ? "user fetched" : "user not found", data: user });
        } catch (error) {
            return res.json({ message: error.message || error, data: [] })
        }
    }

    const addUser = async function (req: Request, res: Response) {
        try {
            //required fields: 'firstName,lastName,roles,email,password, gender'
            const payloadKeys = Object.keys(req.body);
            const userRequiredFieds = getRequiredUserCreationFields();
            const result = validateCreationDataKeys(payloadKeys, userRequiredFieds);
            if (result.length) throw new Error(`Error, ${result.join(',')} missing ...`);
            const { firstName, lastName, roles, email, password, gender, phone } = req.body;
            const validGender = getEnumValue(GENDER, gender);
            const validRole = getEnumValue(USERROLE, roles);
            const roleId = null;
            if (validGender == null || validRole == null || password.trim().length === 0) throw new Error(`invalid roles:${validRole} or gender:${validGender} or password:${password} values`);
            const roleObj: IUserRole = await DB.models.UserRole.findOne({ roleName: validRole }).catch(e => {
                throw new Error(`Error getting user role id for ${validRole}`);
            });
            if (roleObj == null || roleObj._id == null) throw new Error(`user role does not exist`);
            const newUser = new DB.models.User({
                firstName,
                lastName,
                roles: [roleObj._id],
                gender: getEnumValue(GENDER, gender)
            });
            newUser.profile.email = email;
            if (phone) newUser.profile.phone = phone;
            const hash = password && await DB.models.User.schema.statics.hashPassword(password)
                .catch((e: { message: string; }) => { throw new Error("Error hashing user password: " + e.message) });

            Logger.debug(`hash : ${hash || hash.length}`);
            if (hash.length === 0 || hash == null) throw new Error(`Error generating password hash for ${password}:(${password.length}) min length is ${UserSchema.obj.password.min} `);
            newUser.password = hash;
            Logger.log(`hash : ${hash}`);
            const newDBUser = await newUser.save().catch((e: { message: any, code: number }) => {
                Logger.error(`Error!, ${e.code === 11000 ? `user with email ${email} exists` : e.message}`)
                throw new Error(`Error!, ${e.code === 11000 ? `user with email ${email} exists` : e.message}`)
            });
            return res.json({ message: "category added!", data: newDBUser });
        } catch (e) {
            Logger.error(e.message || e);
            return res.json({ message: e.message || e, data: [] })
        }
    }

    const updateUser = async function (req: Request, res: Response) {
        try { //this is not meant for updating roles or password
            const { firstName, lastName, email, password, gender, phone } = req.body;
            const validGender = getEnumValue(GENDER, gender);

            const newUser = new DB.models.User();
            if (firstName) newUser.firstName = firstName;
            if (lastName) newUser.lastName = lastName;
            if (gender && validGender == null) newUser.gender = gender;
            if (email) newUser.profile.email = email;
            if (phone) newUser.profile.phone = phone;

            // const hash: string = newUser.hashPassword(password);
            // if (hash.length === 0 || hash == null) throw new Error(`Error generating password hash `);
            // newUser.password = hash
            const newDBUser = await newUser.save().catch((e: { message: any; }) => { throw new Error(`Error creating category, ${e.message}`) });
            return res.json({ message: "category added!", data: newDBUser });
        } catch (e) {
            Logger.error(e.message || e);
            return res.json({ message: e.message || e, data: [] })
        }
    }

    const updateUserRole = async function (req: Request, res: Response) {
        try {
            const { type, roleId }: { type: number, roleId: string } = req.body;
            const { id } = req.params;
            const validType = getEnumValue(UPDATETYPE, type);
            if (validType == null) throw new Error(`invalid update type : ${validType}`);
            const roleObj: IUserRole = await DB.models.UserRole.findOne({ _id: roleId }).catch(e => {
                throw new Error(`Error getting user role with id: ${roleId}`);
            });
            const userObj: IUser = await DB.models.User.findOne({ _id: id }).catch(e => {
                throw new Error(`Error getting user role with id: ${roleId}`);
            });

            if (roleObj == null || userObj == null) throw new Error(`Error updating user role: ${roleObj?._id}: ${userObj?._id}`);
            switch (validType) {
                case getEnumValue(UPDATETYPE, UPDATETYPE.ADD):
                    if (userObj.roles.indexOf(roleObj._id) === -1) userObj.roles.push(roleObj._id);
                    break;
                case getEnumValue(UPDATETYPE, UPDATETYPE.DELETE):
                    if (userObj.roles.indexOf(roleObj._id) >= 0) {
                        let currentRoles = userObj.roles.filter(v => v.toString() !== roleObj._id.toString());
                        Logger.log(currentRoles, roleId);
                        userObj.roles = currentRoles;
                    }
                    break;
                default:
                    break;
            };
            const newDBUser = await userObj.save().catch((e: { message: any; }) => { throw new Error(`Error creating category, ${e.message}`) });
            return res.json({ message: `User role updated: ${validType}:${roleObj.roleName} `, data: newDBUser });
        } catch (e) {
            Logger.error(e.message || e);
            return res.json({ message: e.message || e, data: [] })
        }
    }

    const changePassword = async function (req: Request, res: Response) {
        try {
            const { password } = req.body;
            const { id } = req.params;

            if (id == null || password == null) throw new Error(`user id or new password is missing`);
            const dbUser: IUser = await DB.models.User.findOne({ _id: id }).catch(e => {
                Logger.error(e.message || e);
                throw new Error(`Error fetching user with id ${id}`)
            });
            const hash: string = await DB.models.User.schema.statics.hashPassword(password);
            Logger.log(hash.length)

            if (hash.length === 0 || hash == null) throw new Error(`Error generating password hash `);
            dbUser.password = hash;
            dbUser.updatedAt = new Date();
            const newDBUser = await dbUser.save().catch((e: { message: any; }) => {
                Logger.error(e.message || e);
                throw new Error(`Error updating user password`)
            });
            return res.json({ message: `password change for user ${dbUser.profile.userName} was successful`, data: newDBUser });
        } catch (e) {
            Logger.error(e.message || e);
            return res.json({ message: e.message || e, data: [] })
        }
    }

    const updateUserState = async function (req: Request, res: Response) {
        try {
            const { id } = req.params;
            if (!id) throw new Error(`Please provide user id`);
            const userObj: IUser[] = await DB.models.User.find({ _id: id });
            const user = userObj[0];
            user.isActive = !user.isActive;
            const dbUser = await user.save().catch(e => { throw new Error(`Error updating user status, ${e.message}`) });

            return res.json({ message: `status for user:${id} was updated`, data: dbUser });
        } catch (error) {
            return res.json({ message: error.message || error, data: [] })
        }
    }

    //delete users questions, tests, and the user
    const removeUser = async function (req: Request, res: Response) {
        try {
            const { id } = req.params;
            if (!id) throw new Error(`Please provide user id to delete`);
            //delete users questions, tests, and the user
            //userDB:  _id
            //testdb: test.creator === user._id
            //questionDB: test === test._id

            const test: ITest = await DB.models.Test.findById(id);
            // if (test == null) throw new Error(`user does not have any test | user deletion aborted!`);
            let resultQuestion = null;
            let resultTest = null;
            if (test !== null) {
                resultQuestion = await DB.models.Question.deleteMany({ test: test._id });
                resultTest = await DB.models.Test.deleteMany({ creator: id });
            }
            const resultUser = await DB.models.User.deleteOne({ _id: id });

            const msg = `DELETED: ${resultQuestion == null ? 0 : resultQuestion?.deletedCount} Question(s); ${resultTest == null ? 0 : resultTest?.deletedCount} Test(s); ${resultUser.deletedCount} User for user with id: ${id}`;
            return res.json({ message: msg, data: [] });
        } catch (error) {
            return res.json({ message: error.message || error, data: [] })
        }
    }

    return {
        getUsers,
        getUser,
        addUser,
        updateUser,
        updateUserState,
        updateUserRole,
        removeUser,
        changePassword
    };
}