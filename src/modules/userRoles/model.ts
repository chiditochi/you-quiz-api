import { Schema } from 'mongoose';
import { GENDER, IUserRole } from '../utility';

const UserRoleSchema = new Schema({
    roleName: {
        type: String, required: true, unique: true
    },
    creator: {
        type: Schema.Types.ObjectId, required: true, ref: "User"
    },
    createdAt: {
        type: Date, default: Date.now
    },
    updatedAt: {
        type: Date, default: Date.now
    }
});

UserRoleSchema.pre<IUserRole>("save", function (next) {
    this.createdAt = new Date();
    this.updateAt = new Date();
    next();
});

UserRoleSchema.pre<IUserRole>("update", function (next) {
    this.updateAt = new Date();
    next();
});


export default UserRoleSchema;