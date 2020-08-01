
import { Application, Request, Response } from "express";


export default function CategoriesController(app: Application){
    const Logger = app.appLogger;

    const getCategories = function(req:Request, res: Response){
        Logger.debug('inside categories controller')
        return res.json({ message: "", data: []})
    }

    return {
        getCategoriess: getCategories
    };
}