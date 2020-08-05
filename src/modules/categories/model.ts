import { Schema } from 'mongoose';
import { GENDER, ICategory } from '../utility';
import { Logger } from './../../app';

const CategoriesSchema = new Schema({
    roleName: {
        type: String, required: true, unique: true, lowercase: true
    },
    creator: {
        type: Schema.Types.ObjectId, required: true, ref: "User"
    },
    createdAt: {
        type: Date, required: true, default: Date.now
    },
    updatedAt: {
        type: Date, default: Date.now
    }

});

CategoriesSchema.pre<ICategory>("save", function (next) {
    // this.roleName = this.roleName.toLocaleLowerCase();
    this.updatedAt = new Date();
    this.createdAt = new Date();
    next();
});

CategoriesSchema.pre<ICategory>("update", function (next) {
    Logger.log(`updating ${this._id}`)
    this.updatedAt = new Date();
    next();
});


export default CategoriesSchema;