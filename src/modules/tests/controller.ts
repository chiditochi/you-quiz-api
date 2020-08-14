import { Application, Request, Response } from "express";
import User from './route';
import { Logger } from './../../app';
import { validateCreationDataKeys, TestRequiredFields, validateCreationDataValues } from "../utility";
import Question from './../questions/route';


export default function UserController(app: Application) {
    const Logger = app.appLogger;
    const DB = app.appDB;

    const getTests = async function (req: Request, res: Response) {
        try {
            const tests = await DB.models.Test.find({}, { answers: 0 }).populate('creator', { profile: 1 }).populate('category', { roleName: 1 });
            return res.json({ message: "all tests", data: tests });
        } catch (e) {
            Logger.error(`Error fetching tests, ${e.message || e}`)
            res.json({ message: e.message || e, data: [] })
        }
    }

    const getTestByCreatorID = async function (req: Request, res: Response) {
        try {
            const { id } = req.params;

            const options = (req.isAdmin || req.isOwner) ? {} : { answers: 0 };
            const testsByCreator = await DB.models.Test.find({ creator: id }, options).populate('creator', { profile: 1 }).populate('category', { roleName: 1 });
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
            const options = (req.isAdmin || req.isOwner) ? {} : { answers: 0 };
            const test = await DB.models.Test.find({ _id: id }, options).populate('creator', { profile: 1 }).populate('category', { roleName: 1 });
            return res.json({ message: test.length > 0 ? "test fetched" : "test not found", data: test });
        } catch (e) {
            Logger.error(`Error fetching users, ${e.message || e}`)
            return res.json({ message: e.message || e, data: [] })
        }
    }

    const addTest = async function (req: Request, res: Response) {
        try {
            const { creator, questionCount, category } = req.body;

            const validateKeys = validateCreationDataKeys(Object.keys({ creator, questionCount, category }), TestRequiredFields);
            const validateValues = validateCreationDataValues(req.body, TestRequiredFields);
            if (validateKeys.length > 0 || validateValues.length > 0) throw new Error(`missing properties: ${validateKeys.length === 0 ? 0 : validateKeys.join(',')} ; invalid values: ${validateValues.length === 0 ? 0 : validateValues.join(',')}`);

            const r = await Promise.all([
                DB.models.Category.findById(category),
                DB.models.User.findById(creator)
            ]);

            if (r.filter(v => v === null).length > 0) throw new Error(`creator id or category id is invalid`);

            const newTest = new DB.models.Test({ creator, questionCount, category });
            const dbNewTest = await newTest.save();
            res.json({ message: `your test was created successfully`, data: dbNewTest })

        } catch (e) {
            Logger.error(e.message || e)
            return res.json({ message: e.message || e, data: [] })
        }
    }

    const updateTest = async function (req: Request, res: Response) {
        try {
            const { questionCount, duration, isTimed } = req.body;
            const { id } = req.params;
            if (parseInt(questionCount) === 0 && parseInt(duration) === 0 && isTimed == null) throw new Error(`missing properties: neither questionCount, duration, isTimed was proived `);

            const dbTest = await DB.models.Test.findById(id);
            if (questionCount && parseInt(questionCount) !== 0) dbTest.questionCount = parseInt(questionCount);
            if (duration && parseInt(duration) !== 0) dbTest.duration = parseInt(duration);
            if (isTimed !== null) dbTest.isTimed = isTimed;


            const dbUpdatedTest = await dbTest.save();
            res.json({ message: `your test was updated successfully`, data: dbUpdatedTest })

        } catch (e) {
            Logger.error(e.message || e)
            return res.json({ message: e.message || e, data: [] })
        }
    }

    // remove test and associated questions
    const removeTest = async function (req: Request, res: Response) {
        try {
            const { id } = req.params;
            //Logger.warn(id)
            const questionDelete = await DB.models.Question.deleteMany({ test: id });
            if (!questionDelete.ok) throw new Error(`Error deleting Questions: Process Aborted`);
            const testDelete = await DB.models.Test.deleteOne({ _id: id });
            if (!testDelete.ok) throw new Error(`Error deleting Test!`);
            res.json({ message: `${testDelete.deletedCount} test(s) and ${questionDelete.deletedCount} question(s) deleted`, data: [] })
        } catch (e) {
            Logger.error(e.message || e)
            return res.json({ message: e.message || e, data: [] })

        }
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