import { Application, NextFunction, Router, Response, Request } from "express";
import path from 'path';
import UserRoles from "./userRoles/route";
import User from "./users/route";
import Test from "./tests/route";
import Question from "./questions/route";
import Category from "./categories/route";
import TestResult from "./testResults/route";
import { UserLoginFields, RequiredUserCreationFields, validateCreationDataKeys, validateCreationDataValues } from "./utility";


export function AppRoutes(app: Application) {
    const router: Router = Router();
    const appEvents = app.appEvents;
    const Logger = app.appLogger;


    router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, password } = req.body;
            const userLogin: UserLoginFields = { email, password };
            const requiredFields = Object.keys(userLogin);
            const validateKeys = validateCreationDataKeys(Object.keys({ email, password }), requiredFields)
            const validateValues = validateCreationDataValues({ email, password }, requiredFields);

            if (validateKeys.length > 0 || validateValues.length > 0) throw new Error(`email and password required | invalid login credentials`)
            appEvents.emit('loginUser', userLogin, req, res);
        } catch (e) {
            Logger.error('/login', e.message || e);
            res.status(400).json({ data: [], message: e.message || e });
        }
    })

    router.post('/signup', async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { firstName, lastName, gender, roles, email, password }: RequiredUserCreationFields = req.body;
            const signupUser: RequiredUserCreationFields = { firstName, lastName, gender, roles, email, password }
            appEvents.emit('signupUser', signupUser, req, res);
        } catch (error) {
            Logger.error('signup: ', error);
            res.status(400).json({ success: error.status, data: [], message: error });
        }
    });

    // router.post('/logout', async function (req: Request, res: Response, next: NextFunction) {
    //     const token = req.body.token;
    //     await appEvents.emit('verifyToken', token, req, res, next)
    // }, (req: Request, res: Response, next: NextFunction) => {
    //     res.json({ data: [], message: 'post log out | clear data details redirect to login or homepage' });
    // });

    //mount api routes
    Category(app, router);
    UserRoles(app, router);
    User(app, router);
    Test(app, router);
    Question(app, router);
    TestResult(app, router);

    router.get('*', (req: Request, res: Response, next: NextFunction) => {
        const path = req.path;
        if (path === '/400') return res.status(400).send({ message: 'Bad Request' });
        if (path === '/401') return res.status(401).send({ message: 'You are not authorized to view this content' });
        if (path === '/403') return res.status(403).send({ message: 'You are forbidden from viewing this content' });
        if (path === '/500') return res.status(500).send({ message: 'Server unable to process request' });
        next()
    })
    // 404
    router.use(function (req: Request, res: Response, next: NextFunction) {
        return res.status(404).send({ message: 'Route ' + req.url + ' Not found.' });
    });
    // 500 - Any server error
    router.use(function (err: Error, req: Request, res: Response, next: NextFunction) {
        return res.status(500).send({ error: err, message: err.message });
    });

    return router;
} 