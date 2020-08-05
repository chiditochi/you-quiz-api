import { Application, Request, Response } from "express";
import User from './route';


export default function Question(app: Application) {
    const Logger = app.appLogger;
    const DB = app.appDB;

    const getQuestions = async function (req: Request, res: Response) {
        // Logger.debug('inside user controller')
        const users = await DB.models.User.find({}).catch(e => Logger.error(`Error fetching users, ${e.message}`))
        return res.json({ message: "", data: users });
    }

    return {
        getQuestions
    };
}