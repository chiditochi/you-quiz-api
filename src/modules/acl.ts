import { Application, Request, Response, NextFunction } from 'express';
import { USERROLE, getEnumValue } from './utility';

export default function AppACL(app: Application) {
    const appEvents = app.appEvents;
    const Logger = app.appLogger;
    const DB = app.appDB;

    const getTokenFromRequestHeader = function (req: Request) {
        const t = req.get('Authorization');
        const tt = (t && t.length > 0) ? t.split(' ')[1] : null;
        return tt;
    }

    const isInRole = function (req: Request, targetRole: USERROLE | USERROLE[]) {
        if (typeof targetRole === 'string') {
            const roleStringValue = getEnumValue(USERROLE, targetRole);
            return (req.currentUser?.data.roles.filter((r: string) => r.toLowerCase() === roleStringValue.toLowerCase())) ? true : false;
        } else { //list of roles i.e targetRole: [Userrole]
            if (req.currentUser == null) return false;
            let f = (targetRole as Array<USERROLE>).filter(v => (req.currentUser?.data.roles.includes(getEnumValue(USERROLE, v))))
            return f.length > 0 ? true : false;
        }
    }

    const populateCurrentUser = function (req: Request, res: Response, next: NextFunction) {
        const token = getTokenFromRequestHeader(req);
        Logger.debug(`Token:  ${token}`)
        if (token) appEvents.emit('verifyToken', token, req, res, next);
        else next()
    }

    const ensureRoleExist = function (req: Request, res: Response, next: NextFunction, role: USERROLE) {
        if (req.currentUser) {
            if (isInRole(req, role))
                return next()
        }
        else {
            let redirectUrl = req.baseUrl + '/403';
            return res.redirect('/api/403')
        }
    }

    const ensureRolesExist = function (roles: USERROLE[]) {
        return function (req: Request, res: Response, next: NextFunction) {
            if (req.currentUser) {
                if (isInRole(req, roles))
                    return next()
            }
            else return res.redirect('/api/403')
        }
    }

    //the other acl functions work based on the req.currentUser object being populated
    const ensureAdmin = function (req: Request, res: Response, next: NextFunction) {
        return ensureRoleExist(req, res, next, USERROLE.ADMIN);
    }

    const ensureManager = function (req: Request, res: Response, next: NextFunction) {
        return ensureRoleExist(req, res, next, USERROLE.MANAGER);
    }

    const ensureTeacher = function (req: Request, res: Response, next: NextFunction) {
        return ensureRoleExist(req, res, next, USERROLE.TEACHER);
    }

    const ensureStudent = function (req: Request, res: Response, next: NextFunction) {
        return ensureRoleExist(req, res, next, USERROLE.STUDENT);
    }
    const ensureOwnerOrAdmin = async function (req: Request, res: Response, next: NextFunction) {
        try {
            const currentUser = req.currentUser;
            const currentUserId = currentUser?.data._id;
            const isAdmin = currentUser?.data.roles.filter((v: { roleName: string; }) => v.roleName === getEnumValue(USERROLE, USERROLE.ADMIN)).length > 0 ? true : false;

            const { id } = req.params;
            if (id === null) throw new Error(`user id: ${id} cannot be null`);
            const dbUserId = await DB.models.User.findOne({ _id: id }, { _id: 1 });
            if (isAdmin || currentUserId === dbUserId.id) return next();
            else return res.redirect('/api/403')
        } catch (e) {
            Logger.error(e.message || e);
            return res.status(500).json({ message: `Error! processing request` });
        }
    }

    const ensureOwner = async function (req: Request, res: Response, next: NextFunction) {
        try {
            const currentUserId = req.currentUser?.data._id;
            const { id } = req.params;
            if (id === null) throw new Error(`user id: ${id} cannot be null`);
            const dbUserId = await DB.models.User.findOne({ _id: id }, { _id: 1 });
            if (currentUserId === dbUserId.id) return next();
            else return res.redirect('/api/403')
        } catch (e) {
            Logger.error(e.message || e);
            return res.status(500).json({ message: `Error! processing request` });
        }
    }

    app.appACL = {
        populateCurrentUser,
        ensureAdmin,
        ensureManager,
        ensureTeacher,
        ensureStudent,
        ensureOwnerOrAdmin,
        isInRole,
        ensureOwner
    }

}