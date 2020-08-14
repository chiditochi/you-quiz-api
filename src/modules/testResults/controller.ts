import { Application, Request, Response } from "express";
import { validateCreationDataKeys, validateCreationDataValues, TestResultRequiredFields, ITest } from "../utility";


export default function UserController(app: Application) {
    const Logger = app.appLogger;
    const DB = app.appDB;

    const getTestResults = async function (req: Request, res: Response) {
        try {
            const testResults = await DB.models.TestResult.find({})
                .populate('user', { profile: 1 })
                .populate({
                    path: 'test', select: { creator: 1, category: 1 }
                    , populate: [
                        { path: 'creator', select: { profile: 1 } },
                        { path: 'category', select: { roleName: 1 } }]
                });
            return res.json({ message: "all test results", data: testResults });
        } catch (e) {
            Logger.error(`Error fetching test results, ${e.message || e}`)
            res.json({ message: e.message || e, data: [] })
        }
    }

    const getTestResult = async function (req: Request, res: Response) {
        try {
            const { id } = req.params;
            if (!id) throw new Error(`Please provide user id`);
            const testResultArray = await DB.models.TestResult.find({ _id: id })
                .populate('user', { profile: 1 })
                .populate({ path: 'test', select: { creator: 1, category: 1 }, populate: [{ path: 'creator', select: { profile: 1 } }, { path: 'category', select: { roleName: 1 } }] });
            return res.json({ message: testResultArray.length > 0 ? "test result fetched" : "test result not found", data: testResultArray });
        } catch (e) {
            Logger.error(`Error fetching test result, ${e.message || e}`)
            return res.json({ message: e.message || e, data: [] })
        }
    }

    const getTestResultByTestID = async function (req: Request, res: Response) {
        try {
            const { id } = req.params;
            if (!id) throw new Error(`please provide a test id !`);
            const testResults = await DB.models.TestResult.find({ test: id }).populate('user', { profile: 1 }).populate({ path: 'test', populate: [{ path: 'creator', select: { profile: 1 } }, { path: 'category', select: { roleName: 1 } }] });
            const msg = testResults.length ? 'results for test fetched' : `test with test id '${id}' was not found`;
            return res.json({ message: msg, data: testResults });
        } catch (e) {
            Logger.error(`Error fetching results for test, ${e.message || e}`)
            res.json({ message: e.message || e, data: [] })
        }
    }

    //returns a Boolean[]
    function markTest(userAnswers: string[], correctAnswers: string[]): boolean[] {
        const markedAnswers = correctAnswers.map(
            (v, i) => v.toLowerCase() === userAnswers[i].toLowerCase() ? true : false)
        return markedAnswers;
    }
    //returns score e.g 80%
    function getScore(markedAnswers: boolean[], questionCount: number): string {
        const correctAnswers = markedAnswers.filter((v: boolean) => v === true);
        const percentage = (correctAnswers.length / parseInt(questionCount.toString())) * 100;
        return `${percentage}%`;
    }

    const addTestResult = async function (req: Request, res: Response) {
        try {
            //'test user answers questionCount' are required
            const { test, user, answers, questionCount } = req.body;

            const validateKeys = validateCreationDataKeys(Object.keys({ test, user, answers, questionCount }), TestResultRequiredFields);
            const validateValues = validateCreationDataValues(req.body, TestResultRequiredFields);
            if (validateKeys.length > 0 || validateValues.length > 0) throw new Error(`missing properties: ${validateKeys.length === 0 ? 0 : validateKeys.join(',')} ; invalid values: ${validateValues.length === 0 ? 0 : validateValues.join(',')}`);

            //ensure student take test once
            const dbTest: ITest = await DB.models.Test.findOne({ _id: test }, { answers: 1 })


            const correctAnswers = dbTest.answers as string[];
            const markedAnswers = markTest(answers, correctAnswers);
            const score = getScore(markedAnswers, questionCount);
            const newTestResult = new DB.models.TestResult({ test, user, questionCount, markedAnswers, score, answers });
            const dbNewTest = await newTestResult.save();
            res.json({ message: `your test was successfully marked and stored`, data: newTestResult })

        } catch (e) {
            let msg = null;
            if (e.code === 11000) msg = `you cannot submit the same test twice! `;
            Logger.error(msg + e.message  || e.message || e)
            return res.status(400).json({ message: msg || e.message || e, data: [] })
        }
    }

    // remove test result
    const removeTestResult = async function (req: Request, res: Response) {
        try {
            const { id } = req.params;
            const testDelete = await DB.models.TestResult.deleteOne({ _id: id });
            if (!testDelete.ok) throw new Error(`Error deleting TestResult!`);
            res.json({ message: `${testDelete.deletedCount} test result deleted`, data: [] })
        } catch (e) {
            Logger.error(e.message || e)
            return res.json({ message: e.message || e, data: [] })
        }
    }


    return {
        getTestResults,
        getTestResult,
        addTestResult,
        removeTestResult,
        getTestResultByTestID
    };
}