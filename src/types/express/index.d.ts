import express, { Request, Response, Application, NextFunction } from 'express';
import { Connection } from "mongoose";
import { IUser, USERROLE, expressRequestFormFileType, formErrorType, expressRequestFormFileType2, IReqQuestionUpload } from '../../modules/utility';
type configType = typeof import("../../config.json");
import AppEvents from '../../modules/appEvents';
import { EventEmitter } from 'events';
import { Fields, File } from 'formidable';
import { IQuestionFromExcel } from './../../modules/utility';

// declare namespace Express {
//     export interface Request {

//       }

//       export interface Response {

//       }

//       export interface Application {
//         appLogger: any,
//         // appDB: Connection
//     }
// }

declare global {
  namespace Express {
    export interface Request {
      currentUser?: IUser,
      formFiles?: expressRequestFormFileType | string[],
      formFile: expressRequestFormFileType2,
      formFields: { fields?: Fields, type?: string, testId?: string },
      formError?: formErrorType,
      appError?: { err: Error, message: string }
      isLoggedIn?: boolean,
      currentUserToken: string,
      token: string,

      questionFileName: string,
      questionFile: File,
      questionType: number,
      questionTestId: string,
      questionQuestions: IQuestionFromExcel[],
      questionTotalDuration: number,
      questionUserFileName: string

      isAdmin: boolean,
      isOwner: boolean
    }

    export interface Response {

    }

    export interface Application {
      appLogger: any,
      appDB: Connection,
      appConfig: configType,
      appEvents: EventEmitter,
      appACL: {
        populateCurrentUser(req: express.Request, res: Response, next: NextFunction): void,
        ensureAdmin(req: Request, res: Response, next: NextFunction): void,
        ensureManager(req: Request, res: Response, next: NextFunction): void,
        ensureTeacher(req: Request, res: Response, next: NextFunction): void,
        ensureStudent(req: Request, res: Response, next: NextFunction): void,
        ensureOwnerOrAdmin(req: Request, res: Response, next: NextFunction): void,
        ensureUserOwner(req: Request, res: Response, next: NextFunction): void,
        ensureTestCreatorOrAdmin(req: Request, res: Response, next: NextFunction): void,
        ensureResultOwnerOrTestCreatorOrAdmin(req: Request, res: Response, next: NextFunction): void,
        ensureAuthenticated(req: Request, res: Response, next: NextFunction): void,
        isInRole(req: Request, targetRole: USERROLE | USERROLE[]): boolean
      }

    }
  }
}