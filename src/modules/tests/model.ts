import { Schema, Types } from 'mongoose';
import { ITest, addDaysToDate } from '../utility';
import { Logger } from '../../app';

const TestSchema = new Schema({
    creator: {
        type: Schema.Types.ObjectId, ref: "User"
    },
    duration: {
        type: Number, default: 0
    },
    isTimed: {
        type: Boolean, default: false
    },
    questionCount: {
        type: Number, required: true, min: 5, max: 100
    },
    category: {
        type: Schema.Types.ObjectId, ref: "Category"
    },
    ttl: {
        type: Number, default: addDaysToDate(new Date(), 7)
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
    Logger.log(`updating Test db`)
    next();
});

TestSchema.methods.toJSON = function () {
    var obj = this.toObject();
    delete obj.password;
    return obj;
}


export default TestSchema;