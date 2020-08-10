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
      // questionUpload:  { file?: File, fileName?: string, type?: string, testId?: string, questions: IQuestionFromExcel[], totalDuration: number },
      formError?: formErrorType,
      appError?: { err: Error, message: string }
      isLoggedIn?: boolean,
      currentUserToken: string,
      token: string,
      // allQuestions: IQuestionFromExcel[],
      // totalDuration: number,
      // uploadedFileName: string

      questionFileName: string,
      questionFile: File,
      questionType: number,
      questionTestId: string,
      questionQuestions: IQuestionFromExcel[],
      questionTotalDuration: number,
      questionUserFileName: string

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
        ensureRolesExist(a: [USERROLE]): void
      }

    }
  }
}