
import { Application, Request, Response } from "express";
import Category from './route';
import { ICategory } from "../utility";


export default function CategoriesController(app: Application) {
    const Logger = app.appLogger;
    const DB = app.appDB;

    const getCategories = async function (req: Request, res: Response) {
        try {
            const categories = await DB.models.Category.find({});
            return res.json({ message: "all categories", data: categories });
        } catch (e) {
            Logger.error(`Error fetching all categories, ${e.message || e}`)
            res.json({ message: e.message || e, data: [] })
        }
    }

    const getCategory = async function (req: Request, res: Response) {
        try {
            const { id } = req.params;
            if (!id) throw new Error(`Please provide category id`);
            const category = await DB.models.Category.find({ _id: id });
            return res.json({ message: category.length > 0 ? "category fetched" : "category not found", data: category });
        } catch (error) {
            return res.json({ message: error.message || error, data: [] })
        }
    }

    //only Admin, Teacher and Manager can add or create a new category
    const addCategory = async function (req: Request, res: Response) {
        try {
            const { roleName, creatorId } = req.body;
            if (roleName === null || creatorId === null) throw new Error(`please provide roleName and creatorId properties`);
            //ensure creator id is valid
            const count = await DB.models.User.count({ _id: creatorId });
            if (!count) throw new Error(`creator ${creatorId} was not found`);
            const nc = { roleName: roleName, creator: creatorId };
            const newCategory: ICategory = new DB.models.Category(nc);
            const newDBCategory = await newCategory.save().catch(e => { throw new Error(`Error creating category, ${e.message}`) });
            return res.json({ message: "category added!", data: newDBCategory });
        } catch (e) {
            Logger.error(e.message || e);
            return res.json({ message: e.message || e, data: [] })
        }
    }
    const updateCategory = async function (req: Request, res: Response) {
        try {
            const { roleName } = req.body;
            const { id } = req.params;

            if (roleName === null || id === null) throw new Error(`please provide roleName and id to update`);
            //ensure creator id is valid
            const dbCategory: ICategory = await DB.models.Category.findOne({ _id: id });
            if (dbCategory == null) throw new Error(`category ${id} was not found`);
            dbCategory.roleName = roleName;
            const newDBCategory = await dbCategory.save().catch(e => { throw new Error(`Error updating category, ${e.message}`) });
            return res.json({ message: "category updated!", data: newDBCategory });
        } catch (e) {
            Logger.error(e.message || e);
            return res.json({ message: e.message || e, data: [] })
        }
    }

    //only admin and the creator can remove a category
    const removeCategory = async function (req: Request, res: Response) {
        try {
            const { id } = req.params;
            if (!id) throw new Error(`Please provide category id`);
            const result = await DB.models.Category.deleteOne({ _id: id });
            if (!result.ok) throw new Error(`Error deleting category with id ${id}`);
            return res.json({ message: `category with id ${id} was deleted`, data: [] });
        } catch (error) {
            return res.json({ message: error.message || error, data: [] })
        }
    }

    return {
        getCategories,
        getCategory,
        addCategory,
        updateCategory,
        removeCategory
    };
}