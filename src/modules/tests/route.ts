import { Application, Router, Request, Response, NextFunction } from "express";
import UserController from "./controller";
import { USERROLE, getEnumValue } from "../utility";

export default function Test(app: Application, router: Router) {
    const Logger = app.appLogger;
    const Controller = UserController(app);
    const AppACL = app.appACL;

    router.all('/test/*', function (req, res, next) {
        Logger.info('inside test routes')
        next()
    })


    router.get('/test/all', Controller.getTests)
    router.get('/test/:id', Controller.getTest)
    router.get('/test/creator/:id', Controller.getTestByCreatorID)
    router.post('/test',
        ensureInRoles([USERROLE.ADMIN, USERROLE.MANAGER, USERROLE.TEACHER]),
        Controller.addTest)
    router.put('/test/:id',
        AppACL.ensureOwnerOrAdmin,
        Controller.updateTest)
    router.delete('/test/:id',
        AppACL.ensureOwnerOrAdmin,
        Controller.removeTest)

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


