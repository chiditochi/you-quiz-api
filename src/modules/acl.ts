import { Application, Request, Response, NextFunction } from 'express';
import { USERROLE, getEnumValue, IUser } from './utility';
import Question from './questions/route';

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
            const userRoles = req.currentUser?.data.roles.map((v: { roleName: any; }) => v.roleName);
            let f = (targetRole as USERROLE[]).filter(v => (userRoles.includes(getEnumValue(USERROLE, v))))
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

    //ensure owner of what????
    //USER: ensure admin or :id is same id as logged in user
    const ensureOwnerOrAdmin = async function (req: Request, res: Response, next: NextFunction) {
        try {
            const currentUser = req.currentUser;
            if (!currentUser) throw new Error('you are not authenticated');
            const currentUserId = currentUser?.data._id;
            const isAdmin = currentUser?.data.roles.filter((v: { roleName: string; }) => v.roleName === getEnumValue(USERROLE, USERROLE.ADMIN)).length > 0 ? true : false;

            const { id } = req.params;
            if (id == null) throw new Error(`user id: ${id} cannot be null`);
            const dbUserId = await DB.models.User.findOne({ _id: id }, { _id: 1 });
            if (isAdmin || currentUserId === dbUserId.id) return next();
            else return res.redirect('/api/403')
        } catch (e) {
            Logger.error(e.message || e);
            return res.json({ message: e.message || e });
        }
    }

    const ensureTestCreatorOrAdmin = async function (req: Request, res: Response, next: NextFunction) {
        try {
            const currentUser = req.currentUser;
            if (!currentUser) throw new Error('you are not authenticated');
            const currentUserId = currentUser?.data._id;
            const isAdmin = currentUser?.data.roles.filter((v: { roleName: string; }) => v.roleName === getEnumValue(USERROLE, USERROLE.ADMIN)).length > 0 ? true : false;

            const { id } = req.params; //test id
            if (id == null) throw new Error(`test id: ${id} cannot be null`);

            const [testById, testByCreatorId, testFromResult] = await Promise.all(
                [DB.models.Test.findById(id),
                DB.models.Test.findOne({ creator: id }),
                DB.models.TestResult.findById(id, { test: 1 }).populate('test', { creator: 1 })
                ]
            );
            const test = testById || testByCreatorId || testFromResult.test;
            const creator = test.creator.toString();
            if (isAdmin) req.isAdmin = true;
            if (currentUserId === creator) req.isOwner = true;
            if (isAdmin || currentUserId === creator) return next();
            else return res.redirect('/api/403')
        } catch (e) {
            Logger.error(e.message || e);
            return res.json({ message: e.message || e });
        }
    }

    const ensureResultOwnerOrTestCreatorOrAdmin = async function (req: Request, res: Response, next: NextFunction) {
        try {

            // => currentUser?data.roles includes "ADMIN"
            //id => result.user === currentUser?data._id
            //or => result.test.creator === currentUser?data._id
            const currentUser = req.currentUser;
            if (!currentUser) throw new Error('you are not authenticated');
            const currentUserId = currentUser?.data._id;
            const isAdmin = currentUser?.data.roles.filter((v: { roleName: string; }) => v.roleName === getEnumValue(USERROLE, USERROLE.ADMIN)).length > 0 ? true : false;
            if (isAdmin) {
                req.isAdmin = true;
                return next()
            };
            const { id } = req.params; //testResult id
            const testResult = await DB.models.TestResult.findById(id, { user: 1, test: 1 }).populate('user', { _id: 1 }).populate('test', { creator: 1 });
            if (testResult && testResult.test.creator.toString() === currentUserId) return next();
            if (testResult.user._id.toString() === currentUserId) {
                req.isOwner = true;
                return next();
            }
            return res.redirect('/api/403')
        } catch (e) {
            Logger.error(e.message || e);
            return res.json({ message: e.message || e });
        }
    }


    const ensureUserOwner = async function (req: Request, res: Response, next: NextFunction) {
        try {
            const currentUserId = req.currentUser?.data._id;
            if (!currentUserId) throw new Error('you are not authenticated');

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

    const ensureAuthenticated = async function (req: Request, res: Response, next: NextFunction) {
        if (req.currentUser == null) return res.redirect('/api/401');
        return next();
    };

    app.appACL = {
        populateCurrentUser,
        ensureAuthenticated,
        ensureAdmin,
        ensureManager,
        ensureTeacher,
        ensureStudent,
        isInRole,
        ensureUserOwner,
        ensureOwnerOrAdmin,
        ensureTestCreatorOrAdmin,
        ensureResultOwnerOrTestCreatorOrAdmin
    }

}