import { Application, Router, Request, NextFunction } from "express";
import UserRoleController from './controller';




export default function UserRoles(app: Application, router: Router) {
    const Logger = app.appLogger;
    const controller = UserRoleController(app);

    router.all('/userRole/*', function (req, res, next) {
        //Logger.log('inside UserRoles')
        next()
    })

    router.get('/userRole/all', controller.getUserRoles)
    router.get('/userRole/:id', controller.getUserRole)


    return router;

}


