import fs from 'fs';
import colors from 'colors';
import path from 'path'
import moment from 'moment';
import mongoose, { Schema } from 'mongoose';
import AppACL from './acl';
import { NextFunction, Request } from 'express';
import { File } from 'formidable'




//Authorization
// export const ensurePolicy = <U, T>(U: Request, appModel: mongoose.Document, prop: string): boolean => {
//     const user = (U.currentUser as mongoose.Document).get(prop);
//     const target = appModel.get(prop);
//     return user === target ? true : false;
// }



module.exports.currentTime = function () {
    return moment().format("YYYY-MM-DD HH:mm:ss")
}

const today = () => moment().format("YYYY-MM-DD");

export function getLogger(appName: string) {
    const t = today();
    const logFileName = `${appName}-${t}.log`;
    const logger = require('tracer').colorConsole({
        transport: [
            function (data: any) { //logging to file
                fs.appendFile('logs/' + logFileName, data.rawoutput + '\n', (err) => {
                    if (err) throw err;
                });
            },
            function (data: any) { //logging to console
                console.log(data.output);
            }
        ],
        filters: {
            log: [colors.bold],
            trace: colors.magenta,
            debug: colors.blue,
            info: colors.green,
            warn: colors.yellow,
            error: [colors.red, colors.bold]
        },
        format: [
            '{{timestamp}} <{{title}}> {{message}} (in {{file}}:{{line}}) Path:: {{path}}', //default format
            {
                error:
                    '{{timestamp}} <{{title}}> {{message}} (in {{file}}:{{line}})' // error format \nCall Stack:\n{{stack}}
            }
        ],
        dateformat: 'HH:MM:ss.L',
        preprocess: function (data: any) {
            data.title = data.title.toUpperCase()
            //format path variable
            const p = data.path.split(path.sep);
            const filename = p.pop();
            const folder = p.pop();
            const newPath = `${folder}${path.sep}${filename}`;
            //console.log("Pa: ", newPath);
            data.path = newPath;
        }
    });

    return logger;
}

export type formErrorType = { stack: Array<string>, message: string } | Error;

export enum GENDER {
    MALE = 1, FEMALE = 2
};

export enum USERROLE {
    ADMIN = 1, MANAGER = 2, TEACHER = 3, STUDENT = 4, USER = 5
};

export enum CATEGORYSTATUS {
    PENDING = 1, APPROVED = 2, DECLINED = 3
};

export enum UPDATETYPE {
    ADD = 1, DELETE = 2, UPDATE = 3
};

export function getEnumList(enumType: any): string[] {
    return Object.keys(enumType).filter(v => !isNaN(Number(v))).map(v => enumType[v]);
}

export function getEnumValue(enumType: any, enumConst: number): string {
    return enumType[enumConst];
}

/* Interfaces */
export interface IResponse<T> {
    success: boolean,
    data: Array<T> | [] | T,
    [message: string]: any
}

export interface IUserDB extends mongoose.Document {
    firstName: String,
    lastName: String,
    gender: String,
    role: String | {},
    [password: string]: any,
    createdAt: Date,
    isActive: Boolean,
    profile: {
        userName: String,
        [phone: string]: any,
    }
};

export const getRequiredUserCreationFields = () => 'firstName,lastName,roles,email,password,gender'.split(',');

export interface IUser extends mongoose.Document {
    userObj: Schema.Types.ObjectId[];
    [_id: string]: any
    firstName: String,
    lastName: String,
    gender: String,
    roles: String[] | { roleName: String, _id: String }[],
    createdAt?: Date,
    isActive?: Boolean,
    profile: {
        userName?: String,
        phone?: String,
        email: String
    }
};

export interface IUserRole extends mongoose.Document {
    roleName: String,
    creator: String,
    createdAt: Date,
    updatedAt?: Date,
    [_id: string]: any | Schema.Types.ObjectId
};

export interface ICategory extends mongoose.Document {
    roleName: String,
    creator: String,
    createdAt?: Date,
    updatedAt?: Date,
    [_id: string]: any
};

export interface ITest extends mongoose.Document {
    [_id: string]: any
    creator: String,
    duration?: Number,
    isTimed: Boolean,
    questionCount: Number,
    answers?: String[],
    category: String,
    createdAt?: Date,
    updatedAt?: Date,
    ttl?: Number
};

export const TestRequiredFields = 'creator questionCount category'.split(" ");


export interface ITestResult extends mongoose.Document {
    [_id: string]: any
    test: String,
    user: String,
    answers: [String],
    questionCount: Number,
    score: String,
    createdAt?: Date,
};

export const TestResultRequiredFields = 'test user answers questionCount'.split(" ");

export interface IReqQuestionUpload { file?: File, fileName?: string, type?: string, testId?: string, questions: IQuestionFromExcel[], totalDuration: number };

export interface IQuestionFromExcel {
    question: String,
    options: [String],
    answer: String,
    duration?: Number
}

export class QuestionFromExcel<IQuestionFromExcel> {
    question: string = '';
    options: string[] = [];
    answer: string = '';
    duration?: number = 0;
}

export const getQuestionFromExcel = (): IQuestionFromExcel => ({
    question: '',
    options: [''],
    answer: '',
    duration: 0
});

export interface IQuestion extends mongoose.Document {
    [_id: string]: any
    test: String,
    questions: [{
        question: String,
        options: [String],
        answer: String,
        duration?: String
    }],
    type?: String,
    createdAt?: Date,
    updatedAt?: Date
};

export enum QuestionType { TEXT = 1, IMAGE = 2 };

export function validateCreationFields(requiredList: string[], reqObj: {}): { status: boolean, error: string[] } {
    let result: { status: boolean, error: string[] } = { status: false, error: [] };
    requiredList.forEach(v => {
        if (!Object.keys(reqObj).includes(v)) {
            result.error.push(v);
        }
    });
    if (result.error.length === 0) {
        result.status = true
    };
    return result;
};

export const validateCreationDataKeys =
    (payload: string[], requiredFields: string[]) => requiredFields.filter(v => payload.indexOf(v) === -1);

export const validateCreationDataValues =
    (payload: any, requiredFields: string[]): string[] => {
        return requiredFields.filter(v => payload[v] == null || payload[v]?.length === 0 || payload[v] <= 0);
    }

export type expressRequestFormFileType = Array<{ fileName: string, file: File }>
export type expressRequestFormFileType2 = { fileName: string, file: File }

export type RequiredUserCreationFields = { firstName: string, lastName: string, gender: number, roles: number, email: string, password: string };

export type UserLoginFields = {
    email: string, password: string
}

export function getMongooseObjectId(id: string): mongoose.Types.ObjectId {
    return mongoose.Types.ObjectId(id)
}

export interface EmailMessageOptions {
    text: string,
    to: string[],
    subject: string,
    html?: string,
    attachment: {
        path?: string,
        type?: string,
        name?: string
        data?: string,
        alternative?: boolean

    }[] | []
}


export const addDaysToDate = (date: Date, days: number) => (new Date(date)).setDate((new Date(date)).getDate() + days);

