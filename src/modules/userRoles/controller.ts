
import { Application, Request, Response } from "express";
import UserRoles from './route';


export default function UserRoleController(app: Application) {
    const Logger = app.appLogger;
    const DB = app.appDB;

    const getUserRoles = async function (req: Request, res: Response) {
        try {
            const userroles = await DB.models.UserRole.find({});
            return res.json({ message: "all roles", data: userroles });
        } catch (e) {
            Logger.error(`Error fetching roles, ${e.message || e}`)
            res.json({ message: e.message || e, data: [] })
        }

    }
    const getUserRole = async function (req: Request, res: Response) {
        try {
            const { id } = req.params;
            if (!id) throw new Error(`Please provide userrole id`);
            const userrole = await DB.models.UserRole.find({ _id: id }).catch(e => Logger.error(`Error fetching user roles, ${e.message}`))
            return res.json({ message: userrole.length > 0 ? "user role fetched" : "user role not found", data: userrole });
        } catch (error) {
            return res.json({ message: error.message || error, data: [] })
        }
    }

    return {
        getUserRoles: getUserRoles,
        getUserRole: getUserRole
    };
}