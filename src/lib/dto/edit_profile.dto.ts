import { Gender, Faculty } from "../../models/user.model";

export type EditProfileDto = {
    familyAndMiddleName: string;
    givenName: string;

    studentId: string;
    major: Faculty;
    dateOfBirth: number;
    gender: Gender;
    phoneNumber: string;
};
