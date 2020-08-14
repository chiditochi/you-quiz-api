import { Schema, Types } from 'mongoose';
import { ITest, addDaysToDate, ITestResult } from '../utility';
import { Logger } from '../../app';

const TestResultSchema = new Schema({
    test: {
        type: Schema.Types.ObjectId, ref: "Test", required: true
    },
    user: {
        type: Schema.Types.ObjectId, ref: "User", required: true
    },
    answers: {
        type: [String], required: true
    },
    markedAnswers: {
        type: [Boolean], required: true, min: 5, max: 100
    },
    questionCount: {
        type: Number, required: true, min: 5, max: 100
    },
    score: {
        type: String
    },
    createdAt: {
        type: Date, default: Date.now
    }
});

TestResultSchema.index({ user: 1, test: 1 }, { unique: true })

TestResultSchema.pre<ITestResult>("save", function (next) {
    next();
});

// TestResultSchema.pre<ITest>("update", function (next) {
//     this.updatedAt = new Date();
//     Logger.log(`updating Test db`)
//     next();
// });

TestResultSchema.methods.toJSON = function () {
    var obj = this.toObject();
    //obj.populate('test').populate('user').exectPopulate()
    return obj;
}


export default TestResultSchema;