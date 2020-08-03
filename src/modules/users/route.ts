import { Application, Router, Request, NextFunction } from "express";
import UserController from "./controller";




export default function User(app: Application, router: Router) {
    const Logger = app.appLogger;
    const Controller = UserController(app);


    router.all('/users/*', function (req, res, next) {
        Logger.log('inside users')
        next()
    })

    router.get('/users/all', app.appACL.ensureAdmin, Controller.getUsers)


    return router;

}


