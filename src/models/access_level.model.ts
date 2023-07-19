import mongoose, { Document, Schema, Types } from "mongoose";

export type PredefinedAccessLevelName = "visitor" | "student";

export enum Permission {
    UPLOAD_MATERIAL = "UPLOAD_MATERIAL",
    VIEW_MATERIAL = "VIEW_MATERIAL",
    EDIT_MATERIAL = "EDIT_MATERIAL",
    DELETE_MATERIAL = "DELETE_MATERIAL",
    UPLOAD_PREVIOUS_EXAM = "UPLOAD_PREVIOUS_EXAM",
    VIEW_PREVIOUS_EXAM = "VIEW_PREVIOUS_EXAM",
    EDIT_PREVIOUS_EXAM = "EDIT_PREVIOUS_EXAM",
    DELETE_PREVIOUS_EXAM = "DELETE_PREVIOUS_EXAM",
    CREATE_SUBJECT = "CREATE_SUBJECT",
    EDIT_SUBJECT = "EDIT_SUBJECT",
    DELETE_SUBJECT = "DELETE_SUBJECT",

    CREATE_CHAPTER = "CREATE_CHAPTER",
    EDIT_CHAPTER = "EDIT_CHAPTER",
    DELETE_CHAPTER = "DELETE_CHAPTER",

    // question templates
    CREATE_QUESTION_TEMPLATE = "CREATE_QUESTION_TEMPLATE",
    VIEW_QUESTION_TEMPLATE = "VIEW_QUESTION_TEMPLATE",
    DELETE_QUESTION_TEMPLATE = "DELETE_QUESTION_TEMPLATE",

    // quiz template
    CREATE_QUIZ_TEMPLATE = "CREATE_QUIZ_TEMPLATE",
    EDIT_QUIZ_TEMPLATE = "EDIT_QUIZ_TEMPLATE",
    DELETE_QUIZ_TEMPLATE = "DELETE_QUIZ_TEMPLATE",
    VIEW_FULL_QUIZ_TEMPLATE = "VIEW_FULL_QUIZ_TEMPLATE",
    VIEW_LIMITED_QUIZ_TEMPLATE = "VIEW_LIMITED_QUIZ_TEMPLATE",
    TAKE_QUIZ = "TAKE_QUIZ",
}

export type AccessLevelDocument = Document & {
    name: string;
    // we hardcode some roles in the system (e.g Visitor), so we need identifiers for them
    predefinedId?: PredefinedAccessLevelName;
    description: string;
    permissions: Permission[];
    createdAt: number;
    createdBy: Types.ObjectId;
    deletedAt: number;
};

const accessLevelSchema = new Schema<AccessLevelDocument>({
    name: String,
    predefinedId: String,
    description: String,
    permissions: [{ type: String, enum: Permission }],
    createdAt: Number,
    createdBy: Schema.Types.ObjectId,
    deletedAt: Number,
});

const AccessLevelModel = mongoose.model<AccessLevelDocument>(
    "access_levels",
    accessLevelSchema
);
export default AccessLevelModel;
