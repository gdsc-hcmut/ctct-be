import { Gender } from "../../models/user.model";

export type EditProfileDto = {
    familyAndMiddleName: string;
    givenName: string;

    studentId: string;
    major: string;
    dateOfBirth: number;
    gender: Gender;
    phoneNumber: string;
};
