import { Application, Router, Request, Response, NextFunction } from "express";
import UserController from "./controller";
import { USERROLE, getEnumValue } from "../utility";


export default function Question(app: Application, router: Router) {
    const Logger = app.appLogger;
    const Controller = UserController(app);
    const AppACL = app.appACL;

    router.all('/question/*', function (req, res, next) {
        Logger.info('inside question routes')
        next()
    })

    router.get('/question/all', Controller.getQuestions);
    router.get('/question/:id', Controller.getQuestion);
    router.get('/question/byTestId/:testId', Controller.getQuestionsByTestId);
    router.post('/question',
        ensureInRoles([USERROLE.ADMIN, USERROLE.MANAGER, USERROLE.TEACHER]),
        Controller.uploadMiddleware,
        Controller.readQuestionsFromExcel,
        Controller.addQuestions);
    router.delete('/question/:id',
        AppACL.ensureOwnerOrAdmin,
        Controller.deleteQuestion);

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


