import mongoose, { Types, Schema } from "mongoose";
import { UserRole } from "./user.model";

export type SubjectDocument = Document & {
    name: string;
    writeAccess: UserRole[];

    description: string;
    createdBy: Types.ObjectId;
    createdAt: number;
    lastUpdatedAt: number;
};

const subjectSchema = new Schema<SubjectDocument>({
    name: String,
    writeAccess: [{ type: String, enum: UserRole }],

    description: String,
    createdBy: { type: Schema.Types.ObjectId, ref: "users" },
    createdAt: Number,
    lastUpdatedAt: Number,
});

const SubjectModel = mongoose.model<SubjectDocument>("subjects", subjectSchema);
export default SubjectModel;
