import { Schema, Types } from 'mongoose';
import { ITest } from '../utility';

const TestSchema = new Schema({
    creator: {
        type: Schema.Types.ObjectId, ref: "User"
    },
    duration: {
        type: String, required: true
    },
    isTimed: {
        type: Boolean, default: false
    },
    questionCount: {
        type: Number, required: true
    },
    category: {
        type: Schema.Types.ObjectId, ref: "Category"
    },
    createdAt: {
        type: Date, default: Date.now
    },
    updatedAt: {
        type: Date, default: Date.now
    }
});

// TestSchema.pre<IUser>("save", function (next) {
//     if (!(this.profile.userName)) {
//         this.profile.userName = `${this.lastName[0].toLowerCase()}.${this.firstName.toLowerCase()}`;
//     }
//     next();
// });

TestSchema.pre<ITest>("update", function (next) {
    this.updatedAt = new Date();
    next();
});

TestSchema.methods.toJSON = function () {
    var obj = this.toObject();
    delete obj.password;
    return obj;
}


export default TestSchema;