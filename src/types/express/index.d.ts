import { Request, Response, Application } from 'express';
import { Connection } from "mongoose";
import { IUser } from '../../modules/utility';
type configType = typeof import("../../config.json");

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
      // formFiles?: expressRequestFormFileType | string[],
      // formFields?: Fields,
      // formError?: formErrorType,
      appError?: { err: Error, message: string }
      isLoggedIn?: boolean,
      currentUserToken: string,
      token: string

    }
    
    export interface Response {
  
    }
    
    export interface Application {
      appLogger: any,
      appDB: Connection,
      appConfig: configType

    }
  }
}