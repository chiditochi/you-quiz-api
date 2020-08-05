import { Application, Router, Request, NextFunction } from "express";
import UserRoleController from './controller';




export default function UserRoles(app: Application, router: Router) {
    const Logger = app.appLogger;
    const controller = UserRoleController(app);

    router.all('/userRoles/*', function (req, res, next) {
        Logger.log('inside UserRoles')
        next()
    })

    router.get('/userRoles/all', controller.getUserRoles)
    router.get('/userRoles/:id', controller.getUserRole)


    return router;

}


