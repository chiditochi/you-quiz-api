import { Schema, Types } from 'mongoose';

import { IQuestion, QuestionType, getEnumValue, getEnumList } from '../utility';

const questionOptions = getEnumList(QuestionType);

const QuestionSchema = new Schema({
    test: {
        type: Schema.Types.ObjectId, ref: "Test", unique: true
    },
    questions: [{
        question: { type: String, required: true },
        options: { type: [String], required: true },
        answer: { type: String, required: true },
        duration: { type: String }
    }],
    type: {
        type: String, enum: questionOptions, default: QuestionType[QuestionType.TEXT]
    },
    createdAt: {
        type: Date, default: Date.now
    },
    updatedAt: {
        type: Date, default: Date.now
    }
});

QuestionSchema.pre<IQuestion>("save", function (next) {
    next();
});

QuestionSchema.pre<IQuestion>("update", function (next) {
    this.updatedAt = new Date();
    next();
});

QuestionSchema.methods.toJSON = function () {
    var obj = this.toObject();
    delete obj.password;
    return obj;
}

QuestionSchema.index({ test: 1 }, { unique: true })

export default QuestionSchema;