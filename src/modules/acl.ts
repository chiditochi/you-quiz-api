import { Application, Request, Response, NextFunction } from 'express';
import { USERROLE, getEnumValue } from './utility';

export default function AppACL(app: Application) {
    const appEvents = app.appEvents;
    const Logger = app.appLogger;

    const getTokenFromRequestHeader = function (req: Request) {
        const t = req.get('Authorization');
        const tt = (t && t.length > 0) ? t.split(' ')[1] : null;
        return tt;
    }

    const isInRole = function (req: Request, targetRole: USERROLE | [USERROLE]) {
        if (typeof targetRole === 'string') {
            const roleStringValue = getEnumValue(USERROLE, targetRole);
            return (req.currentUser?.roles.filter(r => r.toLowerCase() === roleStringValue.toLowerCase())) ? true : false;
        } else { //list of roles i.e targetRole: [Userrole]
            let f = (targetRole as Array<USERROLE>).filter(v => (req.currentUser?.roles.includes(getEnumValue(USERROLE, v))))
            return f.length > 0 ? true : false;
        }
    }

    const populateCurrentUser = function (req: Request, res: Response, next: NextFunction) {
        const token = getTokenFromRequestHeader(req);
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

    const ensureRolesExist = function (roles: [USERROLE]) {
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


    app.appACL = {
        populateCurrentUser,
        ensureAdmin,
        ensureManager,
        ensureTeacher,
        ensureStudent,
        ensureRolesExist
    }

}