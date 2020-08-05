import { Application, Request, Response } from "express";
import User from './route';
import { Logger } from './../../app';


export default function UserController(app: Application) {
    const Logger = app.appLogger;
    const DB = app.appDB;

    const getTests = async function (req: Request, res: Response) {
        try {
            const tests = await DB.models.Test.find({});
            return res.json({ message: "all tests", data: tests });
        } catch (e) {
            Logger.error(`Error fetching tests, ${e.message || e}`)
            res.json({ message: e.message || e, data: [] })
        }
    }

    const getTestByCreatorID = async function (req: Request, res: Response) {
        try {
            const { creatorId } = req.params;
            const testsByCreator = await DB.models.Test.find({ creator: creatorId });
            return res.json({ message: "tests by creator", data: testsByCreator });
        } catch (e) {
            Logger.error(`Error fetching test for creator, ${e.message || e}`)
            res.json({ message: e.message || e, data: [] })
        }
    }

    const getTest = async function (req: Request, res: Response) {
        try {
            const { id } = req.params;
            if (!id) throw new Error(`Please provide user id`);
            const test = await DB.models.Test.find({ _id: id });
            return res.json({ message: test.length > 0 ? "test fetched" : "test not found", data: test });
        } catch (e) {
            Logger.error(`Error fetching users, ${e.message || e}`)
            return res.json({ message: e.message || e, data: [] })
        }
    }
    const addTest = async function (req: Request, res: Response) {
    }
    const updateTest = async function (req: Request, res: Response) {
    }
    // remove test add associated questions
    const removeTest = async function (req: Request, res: Response) {
    }


    return {
        getTests,
        getTest,
        addTest,
        updateTest,
        removeTest,
        getTestByCreatorID
    };
}