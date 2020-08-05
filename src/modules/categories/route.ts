import { Application, Router, Request, NextFunction } from "express";
import UserRoleController from './controller';




export default function Category(app: Application, router: Router) {
    const Logger = app.appLogger;
    const controller = UserRoleController(app);

    router.all('/category/*', function (req, res, next) {
        Logger.log('inside categories')
        next()
    })

    router.get('/category/all', controller.getCategories)
    router.get('/category/:id', controller.getCategory)
    router.post('/category', controller.addCategory)
    router.put('/category/:id', controller.updateCategory)
    router.delete('/category/:id', controller.removeCategory)


    return router;

}


