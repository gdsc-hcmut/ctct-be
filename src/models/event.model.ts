import mongoose, { Document, Schema, Types } from "mongoose";
import { Gender } from "./user.model";

export enum EventType {
    LHOT = "LOP_HOC_ON_TAP",
    OTHER = "OTHER",
}

export type EventDocument = Document & {
    name: string;
    description: string;

    eventType: EventType;
    venue: string;

    hasRegistrationTime: boolean;
    registrationStartedAt?: number;
    registrationEndedAt?: number;

    lhotMetadata: {
        subject: Types.ObjectId;
    };

    registeredUsers: {
        userId: Types.ObjectId;
        hasCheckedIn: boolean;

        givenName: string;
        familyAndMiddleName: string;
        dateOfBirth: number;
        studentId: string;
        major: string;
        gender: Gender;
        phoneNumber: string;

        registeredAt: number;
    }[];

    createdAt: number;
    createdBy: Types.ObjectId;
    lastUpdatedAt: number;
    deletedAt?: number;
};

const eventSchema = new Schema<EventDocument>({
    name: { Type: String, required: true },
    description: { Type: String, required: false },

    eventType: { Type: String, required: true, enum: EventType },
    venue: { Type: String, required: true },

    hasRegistrationTime: { Type: Boolean },
    registrationStartedAt: { Type: Number, required: false },
    registrationEndedAt: { Type: Number, required: false },

    lhotMetadata: {
        subject: { Type: Schema.Types.ObjectId, ref: "subjects" },
    },

    registeredUsers: [
        {
            userId: { Type: Schema.Types.ObjectId, required: true },
            hasCheckedIn: { Type: Boolean },

            givenName: { Type: String, required: true },
            familyAndMiddleName: { Type: String, required: true },
            dateOfBirth: { Type: Number, required: true },
            studentId: { Type: String, required: true },
            major: { Type: String, required: true },
            gender: { Type: String, required: true, enum: Gender },
            phoneNumber: { Type: String, required: true },

            registeredAt: { Type: Number, required: true },
        },
    ],

    createdAt: { Type: Number, required: true },
    createdBy: { Type: Schema.Types.ObjectId, required: true, ref: "users" },
    lastUpdatedAt: { Type: Number, required: true },
    deletedAt: { Type: Number, required: false },
});

const EventModel = mongoose.model<EventDocument>("events", eventSchema);
export default EventModel;
