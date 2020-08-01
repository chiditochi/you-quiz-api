import { Schema } from 'mongoose';
import { GENDER, ICategory } from '../utility';

const CategoriesSchema = new Schema({
    roleName: {
        type: String, required: true, unique: true
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
    this.updateAt = new Date();
    this.createdAt = new Date();
    next();
});

CategoriesSchema.pre<ICategory>("update", function (next) {
    this.updateAt = new Date();
    next();
});


export default CategoriesSchema;