import mongoose, { Types, Schema } from "mongoose";

export enum Semester {
    SEMESTER_181 = "SEMESTER_181",
    SEMESTER_182 = "SEMESTER_182",
    SEMESTER_183 = "SEMESTER_183",

    SEMESTER_191 = "SEMESTER_191",
    SEMESTER_192 = "SEMESTER_192",
    SEMESTER_193 = "SEMESTER_193",

    SEMESTER_201 = "SEMESTER_201",
    SEMESTER_202 = "SEMESTER_202",
    SEMESTER_203 = "SEMESTER_203",

    SEMESTER_211 = "SEMESTER_211",
    SEMESTER_212 = "SEMESTER_212",
    SEMESTER_213 = "SEMESTER_213",

    SEMESTER_221 = "SEMESTER_221",
    SEMESTER_222 = "SEMESTER_222",
    SEMESTER_223 = "SEMESTER_223",

    SEMESTER_231 = "SEMESTER_231",
    SEMESTER_232 = "SEMESTER_232",
    SEMESTER_233 = "SEMESTER_233",
}

export enum PreviousExamType {
    MIDTERM_EXAM = "MIDTERM_EXAM",
    FINAL_EXAM = "FINAL_EXAM",
}

export type PreviousExamDocument = Document & {
    name: string;
    subject: Types.ObjectId;
    semester: Semester;
    type: PreviousExamType;

    visibleTo: Types.ObjectId[];

    description: string;
    resource: Types.ObjectId;

    createdBy: Types.ObjectId;
    createdAt: number;
    deletedAt: number;
};

const previousExamSchema = new Schema<PreviousExamDocument>({
    name: { type: String, required: true },
    subject: { type: Schema.Types.ObjectId, ref: "subjects" },
    semester: { type: String, enum: Semester },
    type: { type: String, enum: PreviousExamType },

    visibleTo: [{ type: Schema.Types.ObjectId, ref: "access_levels" }],

    description: String,
    resource: { type: Schema.Types.ObjectId, ref: "attachments" },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "users",
    },
    createdAt: Number,
    deletedAt: Number,
});

const PreviousExamModel = mongoose.model<PreviousExamDocument>(
    "previous_exams",
    previousExamSchema
);
export default PreviousExamModel;
