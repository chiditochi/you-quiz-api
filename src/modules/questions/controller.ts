import { Application, Request, Response, NextFunction } from "express";
import { IncomingForm, Fields, Files, File } from "formidable";
import path from 'path';
import moment from "moment";
import fs from 'fs';
import Excel, { Row } from 'exceljs-lightweight';
import { IQuestion, ITest, getEnumValue, QuestionType, getEnumList, EmailMessageOptions, ITestQuestionEmailTemplate, getTestQuestionEmailTemplate, IUser, IQuestionFromExcel, getQuestionFromExcel, getUserFullName } from './../utility';

export default function Question(app: Application) {
    const Logger = app.appLogger;
    const DB = app.appDB;
    const AppEvents = app.appEvents;

    const getQuestions = async function (req: Request, res: Response) {
        try {
            const questions = await DB.models.Question.find({}).populate('test').populate('test.creator', { profile: 1 }).populate('test').populate({ path: 'test', populate: [{ path: 'creator', select: { profile: 1 } }, { path: 'category', select: { roleName: 1 } }] });
            return res.json({ message: "all questions", data: questions });
        } catch (e) {
            Logger.error(`Error fetching questions, ${e.message || e}`)
            res.json({ message: e.message || e, data: [] })
        }
    }

    const getQuestion = async function (req: Request, res: Response) {
        try {
            const { id } = req.params;
            const question = await DB.models.Question.find({ _id: id }).populate('test').populate({ path: 'test', populate: [{ path: 'creator', select: { profile: 1 } }, { path: 'category', select: { roleName: 1 } }] });
            return res.json({ message: "question fetched", data: question });
        } catch (e) {
            Logger.error(`Error fetching question, ${e.message || e}`)
            res.json({ message: e.message || e, data: [] })
        }
    }

    const getQuestionsByTestId = async function (req: Request, res: Response) {
        try {
            const { testId } = req.params;
            const questions = await DB.models.Question.find({ test: testId }).populate('test').populate({ path: 'test', populate: [{ path: 'creator', select: { profile: 1 } }, { path: 'category', select: { roleName: 1 } }] });
            return res.json({ message: "test question(s) fetched", data: questions });
        } catch (e) {
            Logger.error(`Error fetching test questions, ${e.message || e}`)
            res.json({ message: e.message || e, data: [] })
        }
    }

    const removeFile = async function (fileName: string) {
        try {
            return fs.unlink(fileName, function (err) {
                if (err) throw err;
                return { status: true, message: `file ${fileName} deleted` }
            })
        } catch (e) {
            Logger.error(e.message || e)
            return { status: false, message: `error deleting file ${fileName}` }
        }
    }

    //requiredFields = [ type = text | pics, testId and excel file]
    const uploadMiddleware = async function (req: Request, res: Response, next: NextFunction) {
        const validfileExtensions = ['xlsx'];

        const form = new IncomingForm();
        form.encoding = 'utf-8';

        form.uploadDir = path.join(process.cwd(), 'src', 'assets', 'questions');
        let fileName = '';
        //req.questionUpload;
        try {
            form
                .on('fileBegin', function (name, file: File) {
                    let ext = file.name.split('.')[1];
                    if (ext !== 'xlsx') req.formError = { message: `'${ext}' is not a valid extension file for upload!`, stack: [] };
                    file.name = `${name}-${moment().valueOf()}.${ext}`;
                    var fPath = file.path.split(path.sep);
                    fPath.pop();
                    fPath.push(file.name);
                    file.path = fPath.join(path.sep);
                    req.questionUserFileName = name;
                    req.questionFileName = file.name;
                })
                .on('error', function (e) {
                    throw e;
                })
                .parse(req as any, async (e: any, fields: Fields, files: Files) => {
                    if (e || req.formError?.message) {
                        Logger.error(e || req.formError?.message)
                        req.questionFile && await removeFile(req.questionFile.path);
                        res.json({ message: req.formError?.message || `Error in uploaded excel`, data: [] })
                    } else {
                        //process the excel file
                        const f = files[req.questionUserFileName];
                        Logger.warn(e, fields, f.path)
                        req.questionFile = f;
                        req.questionType = fields.type as unknown as number;
                        req.questionTestId = fields.testId as string;

                        next();
                    }
                });

        } catch (e) {
            Logger.error(e.message || e)
            req.questionFile && await removeFile(req.questionFile.path);
            res.json({ message: `Error ${e.message || e}`, data: [] })
        }
    }

    const readQuestionsFromExcel = async function (req: Request, res: Response, next: NextFunction) {
        //process question extraction from excel file
        try {
            let t = req.questionType;
            let typeString = getEnumValue(QuestionType, t)
            if (typeString == null) throw new Error(`Please provide a valid type: ${getEnumList(QuestionType)}`);

            const filePath: string = req.questionFile.path as string;
            Logger.info(`Processing excel file: ${filePath}`);
            let workbook = new Excel.Workbook();
            await workbook.xlsx.readFile(filePath as string)
            // use workbook
            let questionSheet = workbook.getWorksheet('questions');
            let duration: number = 0;
            let allQuestions: IQuestionFromExcel[] = [];
            questionSheet.eachRow(function (row: Row, rowNumber: number) {
                //colA=question | colB,C,D,E = options | colE = answer | colF? = duration
                if (rowNumber > 1) {
                    const currentQuestion = getQuestionFromExcel();
                    currentQuestion.question = row.getCell('A').value as string
                    currentQuestion.options.pop();
                    currentQuestion.options.push((row.getCell('B').value as string).toString())
                    currentQuestion.options.push((row.getCell('C').value as string).toString())
                    currentQuestion.options.push((row.getCell('D').value as string).toString())
                    currentQuestion.options.push((row.getCell('E').value as string).toString())
                    currentQuestion.answer = (row.getCell('F').value as string).toString();
                    const d: number = row.getCell('G').value as number;
                    if (d && d > 0) {
                        currentQuestion.duration = d;
                        duration += d;
                    }
                    allQuestions.push(currentQuestion);
                }

            });
            req.questionQuestions = allQuestions;
            req.questionTotalDuration = duration;
            next()
        } catch (e) {
            req.questionQuestions = [];
            req.questionTotalDuration = 0;
            Logger.error(e.message || e)
            const filePath: string = req.questionFile.path as string;
            await removeFile(filePath);
            res.json({ message: e.message || e || `Error uploading question from uploaded excel file`, data: [] })
        }
    }

    const addQuestions = async function (req: Request, res: Response) {
        const type = req.questionType as number;
        const testId = req.questionTestId;
        const file = req.questionFile;
        try {
            const dbTest: ITest = await DB.models.Test.findById(testId).populate('category', { roleName: 1 });
            if (dbTest == null) throw new Error(`Test with id ${testId} does not exist`);
            const dbTestQuestion: IQuestion = await DB.models.Question.findOne({ test: testId });
            if (dbTestQuestion !== null) throw new Error(`A Question with test id ${dbTest._id} exists: Question ID: ${dbTestQuestion._id}`);
            if (req.questionTotalDuration > 0) {
                dbTest.isTimed = true;
                dbTest.duration = req.questionTotalDuration;
                await dbTest.save();
            }
            const dbQuestion: IQuestion = new DB.models.Question();
            dbQuestion.test = dbTest._id;
            dbQuestion.questions = req.questionQuestions as IQuestion["questions"];
            dbQuestion.type = getEnumValue(QuestionType, type);

            dbTest.answers = req.questionQuestions.map(v => v.answer);
            dbTest.updatedAt = new Date();
            const updateddbTest = await dbTest.save();
            const updatedNewQuestion = await dbQuestion.save();
            await removeFile(file?.path as string);

            //send the TestCreator an email
            const eTestCreatorUser = req.currentUser?.data;
            const eTestCreatorFullName = getUserFullName(eTestCreatorUser);
            const eTestCreatorsEmail = eTestCreatorUser.profile.email;
            const eDbTestCategory = dbTest.category as { _id: String, roleName: String };
            const opt: EmailMessageOptions = {
                subject: `Test Question Uploaded`,
                to: [eTestCreatorsEmail],
                text: "",
                html: getTestQuestionEmailTemplate({
                    recipient: {
                        fullName: eTestCreatorFullName
                    },
                    test: {
                        isTimed: dbTest.isTimed,
                        categoryName: eDbTestCategory.roleName,
                        questionCount: dbTest.questionCount,
                    }
                } as ITestQuestionEmailTemplate),
                attachment: []
            };
            AppEvents.emit("sendEmail", opt) //end of email sending

            return res.json({ message: `${req.questionQuestions.length} questions added to test with id ${testId}`, data: updatedNewQuestion });
        } catch (e) {
            await removeFile(file.path as string);
            Logger.error(e.message || e || `Error posting questions`)
            res.json({ message: e.message || e, data: [] })
        }
    }


    const deleteQuestion = async function (req: Request, res: Response) {
        const { id } = req.params;
        try {
            const questions = await DB.models.Question.deleteOne({ _id: id });
            return res.json({ message: `${questions.deletedCount} test question(s) deleted`, data: [] });
        } catch (e) {
            Logger.error(`Error deleting test questions with id ${id}, ${e.message || e}`)
            res.json({ message: e.message || e, data: [] })
        }
    }


    return {
        getQuestions,
        getQuestion,
        getQuestionsByTestId,
        uploadMiddleware,
        readQuestionsFromExcel,
        addQuestions,
        deleteQuestion
    };
}