import { Application, Router, Request, NextFunction } from "express";
import UserRoleController from './controller';




export default function Categories(app: Application, router: Router){
    const Logger = app.appLogger;
    const controller = UserRoleController(app);

    router.all('/categories/*', function(req, res, next){
        Logger.log('inside categories')
        next()
    })

    router.get('/categories/all', function(req, res, next){
        return res.json({ message: 'categories', data: []})
    })


    return router;

}


