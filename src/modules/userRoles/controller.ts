
import { Application, Request, Response } from "express";


export default function UserRoleController(app: Application){
    const Logger = app.appLogger;

    const getUserRoles = function(req:Request, res: Response){
        Logger.debug('inside user controller')
        return res.json({ message: "", data: []})
    }

    return {
        getUserRoles: getUserRoles
    };
}