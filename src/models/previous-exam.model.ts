import mongoose, { Types, Schema } from "mongoose";

export type PreviousExamDocument = Document & {
    name: string;
    subject: Types.ObjectId;

    visibleTo: Types.ObjectId[];

    subtitle: string;
    description: string;
    resource: Types.ObjectId;
    createdBy: Types.ObjectId;
    createdAt: number;

    deletedAt: number;
};

const previousExamSchema = new Schema<PreviousExamDocument>({
    name: { type: String, required: true },
    subject: { type: Schema.Types.ObjectId, ref: "subjects" },

    visibleTo: [{ type: Schema.Types.ObjectId, ref: "access_levels" }],

    subtitle: String,
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
