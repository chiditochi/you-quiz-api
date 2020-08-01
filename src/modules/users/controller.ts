import { Application, Request, Response } from "express";


export default function UserController(app: Application){
    const Logger = app.appLogger;

    const getUsers = function(req:Request, res: Response){
        Logger.debug('inside user controller')
        return res.json({ message: "", data: []})
    }

    return {
        getUsers: getUsers
    };
}