import { Application, Router, Request, Response, NextFunction } from "express";
import TestResultsController from "./controller";
import { USERROLE, getEnumValue } from "../utility";

export default function Test(app: Application, router: Router) {
    const Logger = app.appLogger;
    const Controller = TestResultsController(app);
    const AppACL = app.appACL;

    router.all('/testResult/*', function (req, res, next) {
        Logger.info('inside testResult routes')
        next()
    })

    router.get('/testResult/all',
        ensureInRoles([USERROLE.ADMIN, USERROLE.MANAGER, USERROLE.TEACHER]),
        Controller.getTestResults)
    router.get('/testResult/:id',
        AppACL.ensureResultOwnerOrTestCreatorOrAdmin,
        Controller.getTestResult)
    router.get('/testResult/test/:id',
        AppACL.ensureTestCreatorOrAdmin,
        Controller.getTestResultByTestID)
    router.post('/testResult',
        ensureInRoles([USERROLE.STUDENT, USERROLE.USER]),
        Controller.addTestResult)
    router.delete('/testResult/:id',
        AppACL.ensureTestCreatorOrAdmin,
        Controller.removeTestResult)

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


