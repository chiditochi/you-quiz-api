import fs from 'fs';
import colors from  'colors';
import path from 'path'
import moment from 'moment';
import mongoose from 'mongoose';



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

export enum GENDER {
    MALE = 1, FEMALE = 2
};

export enum USERROLE {
    ADMIN = 1, MANAGER = 2, TEACHER =3, STUDENT = 4, USER = 5
};

export enum CATEGORYSTATUS {
    PENDING = 1, APPROVED = 2, DECLINED = 3
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

export interface IUser extends mongoose.Document {
    [_id: string]: any
    firstName: String,
    lastName: String,
    gender: String,
    roles: [String],
    createdAt: Date,
    isActive: Boolean,
    profile: {
        [phone: string]: any
    }
};

export interface IUserRole extends mongoose.Document {
    roleName: String,
    creator: String,
    createdAt: Date,
    [_id: string]: any
};

export interface ICategory extends mongoose.Document {
    name: String,
    creator: String,
    createdAt: Date,
    [_id: string]: any
};

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

export type expressRequestFormFileType = Array<{ fileName: string, file: File }>

export type RequiredUserCreationFields = { firstName: string, lastName: string, gender: string, role: string, email: string, phone: string, password: string };

export type UserLoginFields = {
    email: string, password: string
}
