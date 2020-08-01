import { Application, NextFunction, Router, Response, Request } from "express";
import path from 'path';
import UserRoles from "./userRoles/route";
import User from "./users/route";


export function AppRoutes(app: Application){
    const router: Router = Router();
    const appEvents = app.get("AppEvents");
    const Logger = app.appLogger;





    // router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
    //     try {
    //         const { email, password } = req.body;
    //         const userLogin: UserLoginFields = { email, password };
    //         appEvents.emit('loginUser', userLogin, req, res);
    //     } catch (error) {
    //         Logger.error('/login', error);
    //         res.status(400).json({ data: [], message: error });
    //     }
    // })

    // router.post('/signup', async (req: Request, res: Response, next: NextFunction) => {
    //     try {
    //         const { firstName, lastName, gender, phone, role, email, password }: RequiredUserCreationFields = req.body;
    //         const signupUser: RequiredUserCreationFields = { firstName, lastName, gender, phone, role, email, password }
    //         appEvents.emit('signupUser', signupUser, req, res);
    //     } catch (error) {
    //         Logger.error('signup: ', error);
    //         res.status(400).json({ success: error.status, data: [], message: error });
    //     }
    // });

    // router.post('/logout', async function (req: Request, res: Response, next: NextFunction) {
    //     const token = req.body.token;
    //     await appEvents.emit('verifyToken', token, req, res, next)
    // }, (req: Request, res: Response, next: NextFunction) => {
    //     res.json({ data: [], message: 'post log out | clear data details redirect to login or homepage' });
    // });

    //mount api routes
    // UserRoutes(app, router);
    // //router.use(UserRouter)
    // UserRoleRoutes(app, router);
    // PortfolioCategoryRoutes(app, router);
    // PortfolioRoutes(app, router);
    // AdvertItemRoutes(app, router);

    // router.use('/userRoles', UserRoles(app, router))
    UserRoles(app, router);
    User(app, router);

    router.get('*', (req: Request, res: Response, next: NextFunction) => {
        const path = req.path;
        if (path === '/400') return res.status(400).send({ message: 'Bad Request' });
        if (path === '/401') return res.status(401).send({ message: 'You are not authorized to view this content' });
        if (path === '/403') return res.status(403).send({ message: 'You are forbidden from viewing this content' });
        if (path === '/500') return res.status(500).send({ message: 'Server unable to process request' });
        next()
    })
    //Handle 404 and 500 errors
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