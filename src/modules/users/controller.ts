import { Application, Request, Response } from "express";
import User from './route';


export default function UserController(app: Application) {
    const Logger = app.appLogger;
    const DB = app.appDB;

    const getUsers = async function (req: Request, res: Response) {
        // Logger.debug('inside user controller')
        const users = await DB.models.User.find({}).catch(e => Logger.error(`Error fetching users, ${e.message}`))
        return res.json({ message: "", data: users });
    }

    return {
        getUsers: getUsers
    };
}