import { Application, Request, Response, NextFunction } from 'express';
import { USERROLE, getEnumValue } from './utility';

export default function (app: Application) {
    const appEvents = app.get("AppEvents");
    const Logger = app.appLogger;

    const getTokenFromRequestHeader = function(req: Request){
        const t = req.get('Authorization');
        const tt = (t && t.length > 0) ? t.split(' ')[1] : null;
        return tt;
    }

    const isInRole = function(req: Request, targetRole : USERROLE){
        const roleStringValue = getEnumValue(USERROLE, targetRole)
        return req.currentUser?.roles.filter(r => r.toLowerCase() === roleStringValue.toLowerCase()) ? true : false;
    }

    const populateCurrentUser = function (req: Request, res: Response, next: NextFunction) {
        const token = getTokenFromRequestHeader(req);
        if (token) appEvents.emit('verifyToken', token, req, res, next);
        else next()
    }

    const ensureRoleExist = function(req: Request, res: Response, next: NextFunction, role: USERROLE){
        if( req.currentUser ){
            if(isInRole(req, role)) 
                return next()
        }
        else 
            return res.redirect('/401')
    }

    //the other acl functions work based on the req.currentUser object being populated
    const ensureAdmin = function (req: Request, res: Response, next: NextFunction) {
        return ensureRoleExist(req, res, next, USERROLE.ADMIN);
    }

    const ensureManager = function (req: Request, res: Response, next: NextFunction) {
        return ensureRoleExist(req, res, next, USERROLE.MANAGER);
    }

    const ensureTeacher = function (req: Request, res: Response, next: NextFunction) {
        return ensureRoleExist(req, res, next, USERROLE.TEACHER);
    }

    const ensureStudent = function (req: Request, res: Response, next: NextFunction) {
        return ensureRoleExist(req, res, next, USERROLE.STUDENT);
    }


    return {
        populateCurrentUser,
        ensureAdmin,
        ensureManager,
        ensureTeacher,
        ensureStudent
    }

}