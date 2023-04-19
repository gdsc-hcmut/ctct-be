import mongoose, { Types, Schema } from "mongoose";

export type SubjectDocument = Document & {
    name: string;
    createdBy: Types.ObjectId;
    createdAt: number;
    lastUpdatedAt: number;
};

const subjectSchema = new Schema<SubjectDocument>({
    name: String,
    createdBy: { type: Schema.Types.ObjectId, ref: "users" },
    createdAt: Number,
    lastUpdatedAt: Number,
});

const SubjectModel = mongoose.model<SubjectDocument>("subjects", subjectSchema);
export default SubjectModel;
