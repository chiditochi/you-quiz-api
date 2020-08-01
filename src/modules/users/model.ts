import { Schema, Types } from 'mongoose';

import { GENDER, USERROLE } from '../utility';
import bcrypt from 'bcryptjs';
import { IUser } from './../utility';

const UserSchema = new Schema({
    firstName: {
        type: String, required: true
    },
    lastName: {
        type: String, required: true
    },
    gender: {
        type: String, required: true, default: GENDER[GENDER.MALE]
    },
    roles: [{
        type: Schema.Types.ObjectId, ref: "UserRole"
    }],
    createdAt: {
        type: Date, default: Date.now
    },
    updatedAt: {
        type: Date, default: Date.now
    },
    isActive: {
        type: Boolean, default: false
    },
    password: {
        type: String, required: true
    },
    profile: {
        userName: {
            type: String, default: function () { this.lastName[0].toLowerCase() + "." + this.firstName.toLowerCase() }
        },
        phone: { type: String, required: true },
        email: { type: String, unique: true }
    }

});

UserSchema.pre<IUser>("save", function (next) {
    if (!(this.profile.userName)) {
        this.profile.userName = `${this.lastName[0].toLowerCase()}.${this.firstName.toLowerCase()}`;
    }
    next();
});

UserSchema.pre<IUser>("update", function (next) {
    this.updatedAt = new Date();
    next();
});

UserSchema.methods.toJSON = function () {
    var obj = this.toObject();
    delete obj.password;
    return obj;
}

UserSchema.statics.hashPassword = async function (password: string): Promise<string> {
    return await bcrypt.hash(password, 10)
}

UserSchema.statics.comparePassword = async function (password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
}


export default UserSchema;