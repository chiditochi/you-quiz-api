import { Application, Router, Request, Response, NextFunction } from "express";
import UserController from "./controller";
import UserRoles from './../userRoles/route';
import { USERROLE } from "../utility";
import { getEnumValue } from './../utility';
import AppACL from './../acl';


export default function User(app: Application, router: Router) {
    const Logger = app.appLogger;
    const AppACL = app.appACL;
    const DB = app.appDB;
    const Controller = UserController(app);

    router.all('/user/*', function (req, res, next) {
        Logger.info('inside user routes')
        next()
    })

    // router.get('/users/all', app.appACL.ensureAdmin, Controller.getUsers)
    const a: number[] = [];
    router.get('/user/all', Controller.getUsers)
    router.get('/user/:id', Controller.getUser)
    router.post('/user', Controller.addUser)
    router.put('/user/:id',
        AppACL.ensureUserOwner,
        Controller.updateUser)
    router.put('/user/updateRole/:id',
        ensureInRoles([USERROLE.ADMIN, USERROLE.MANAGER]),
        Controller.updateUserRole)
    //only manager or admin
    router.put('/user/changeState/:id',
        ensureInRoles([USERROLE.ADMIN, USERROLE.MANAGER]),
        Controller.updateUserState)
    //only the user can do this
    router.put('/user/changePassword/:id',
        AppACL.ensureUserOwner,
        Controller.changePassword)
    //only admin
    router.delete('/user/:id',
        ensureInRoles([USERROLE.ADMIN, USERROLE.MANAGER]),
        Controller.removeUser)


    function ensureInRoles(roles: USERROLE[]) {
        return function (req: Request, res: Response, next: NextFunction) {
            try {
                if (req.currentUser) {
                    const isAdmin = req.currentUser.data.roles.filter((v: { roleName: string; }) => v.roleName === getEnumValue(USERROLE, USERROLE.ADMIN)).length > 0 ? true : false;
                    if (isAdmin) {
                        return next()
                    }
                    else if (AppACL.isInRole(req, roles)) {
                        return next()
                    } else {
                        return res.redirect('/api/403')
                    }
                }
                else return res.redirect('/api/403')
            } catch (e) {
                Logger.error(e.message || e)
                return res.status(500).json({ message: `Error! processing request` })
            }
        }
    }



    return router;
}


