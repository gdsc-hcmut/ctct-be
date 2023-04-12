import mongoose, { Types, Schema } from "mongoose";

export type SubjectDocument = Document & {
    name: string;
    createdBy: Types.ObjectId;
    createdAt: number;
};

const subjectSchema = new Schema<SubjectDocument>({
    name: { type: String, required: true },
    createdBy: {
        type: Types.ObjectId,
        ref: "users",
    },
    createdAt: Number,
});

const SubjectModel = mongoose.model<SubjectDocument>("subjects", subjectSchema);
export default SubjectModel;
