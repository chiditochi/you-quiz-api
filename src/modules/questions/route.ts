import { Application, Router, Request, NextFunction } from "express";
import UserController from "./controller";


export default function Question(app: Application, router: Router) {
    const Logger = app.appLogger;
    const Controller = UserController(app);

    router.all('/question/*', function (req, res, next) {
        Logger.info('inside question routes')
        next()
    })

    // router.get('/users/all', app.appACL.ensureAdmin, Controller.getUsers)

    router.get('/question/all', Controller.getQuestions)


    return router;

}


