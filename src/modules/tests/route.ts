import { Application, Router, Request, NextFunction } from "express";
import UserController from "./controller";

export default function Test(app: Application, router: Router) {
    const Logger = app.appLogger;
    const Controller = UserController(app);

    router.all('/test/*', function (req, res, next) {
        Logger.info('inside test routes')
        next()
    })

    // router.get('/users/all', app.appACL.ensureAdmin, Controller.getUsers)

    router.get('/test/all', Controller.getTests)
    router.get('/test/:id', Controller.getTest)
    router.get('/test/:creator', Controller.getTestByCreatorID)
    router.post('/test', Controller.addTest)
    router.put('/test/:id', Controller.updateTest)
    router.delete('/test/:id', Controller.removeTest)

    return router;

}


