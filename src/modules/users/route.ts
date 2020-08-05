import { Application, Router, Request, NextFunction } from "express";
import UserController from "./controller";


export default function User(app: Application, router: Router) {
    const Logger = app.appLogger;
    const Controller = UserController(app);

    router.all('/users/*', function (req, res, next) {
        Logger.info('inside user routes')
        next()
    })

    // router.get('/users/all', app.appACL.ensureAdmin, Controller.getUsers)

    router.get('/users/all', Controller.getUsers)
    router.get('/users/:id', Controller.getUser)
    router.post('/users', Controller.addUser)
    router.put('/users/:id', Controller.updateUser)
    router.put('/users/updateRole/:id', Controller.updateUserRole)
    //only manager or admin
    router.put('/users/changeState/:id', Controller.updateUserState)
    //only the user can do this
    router.put('/users/changePassword/:id', Controller.changePassword)
    //only admin
    router.delete('/users/:id', Controller.removeUser)


    return router;
}


