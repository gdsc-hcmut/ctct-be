import { inject, injectable } from "inversify";
import { Router } from "express";
import { Controller } from "./controller";
import { Request, Response, ServiceType } from "../types";
import {
    AuthService,
    SubjectService,
    MaterialService,
    PreviousExamService,
    AccessLevelService,
} from "../services/index";
import mongoose, { Types } from "mongoose";
import _ from "lodash";
import { Permission } from "../models/access_level.model";

@injectable()
export class SubjectController extends Controller {
    public readonly router = Router();
    public readonly path = "/subject";

    constructor(
        @inject(ServiceType.Auth) private authService: AuthService,
        @inject(ServiceType.Subject) private subjectService: SubjectService,
        @inject(ServiceType.Material) private materialService: MaterialService,
        @inject(ServiceType.PreviousExam)
        private previousExamService: PreviousExamService,
        @inject(ServiceType.AccessLevel)
        private accessLevelService: AccessLevelService
    ) {
        super();

        this.router.get("/all", this.getAllSubjects.bind(this));

        this.router.all("*", authService.authenticate());
        this.router.post("/", this.create.bind(this));
        this.router.patch("/edit/:docId", this.editSubject.bind(this));
        this.router.delete("/delete/:docId", this.deleteOne.bind(this));
    }

    async create(req: Request, res: Response) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const { userId } = req.tokenMeta;
            const { name } = req.body;
            let { description } = req.body;
            if (!description) description = "";

            if (
                !(await this.accessLevelService.accessLevelsCanPerformAction(
                    req.tokenMeta.accessLevels,
                    Permission.CREATE_SUBJECT,
                    req.tokenMeta.isManager
                ))
            ) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            if (!name) {
                throw new Error(`Missing 'name' field`);
            }

            const doc = await this.subjectService.create(
                name,
                userId,
                description
            );
            res.composer.success(doc);
            await session.commitTransaction();
        } catch (error) {
            console.log(error);
            await session.abortTransaction();
            res.composer.badRequest(error.message);
        } finally {
            await session.endSession();
        }
    }

    async getAllSubjects(req: Request, res: Response) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const ans = await this.subjectService.find({});
            res.composer.success(ans);
            await session.commitTransaction();
        } catch (error) {
            console.log(error);
            await session.abortTransaction();
            res.composer.badRequest(error.message);
        } finally {
            await session.endSession();
        }
    }

    async editSubject(req: Request, res: Response) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const userAccessLevels = req.tokenMeta.accessLevels;

            if (
                !(await this.accessLevelService.accessLevelsCanPerformAction(
                    userAccessLevels,
                    Permission.EDIT_SUBJECT,
                    req.tokenMeta.isManager
                ))
            ) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const docId = new Types.ObjectId(req.params.docId);
            const doc = await this.subjectService.findOne({
                _id: docId,
            });
            if (!doc) {
                throw new Error(`Document doesn't exist`);
            }

            const info = _.pick(req.body, ["name", "description"]);

            await this.subjectService.findOneAndUpdate(
                { _id: docId },
                {
                    ...info,
                    lastUpdatedAt: Date.now(),
                }
            );
            res.composer.success(true);
            await session.commitTransaction();
        } catch (error) {
            console.log(error);
            await session.abortTransaction();
            res.composer.badRequest(error.message);
        } finally {
            await session.endSession();
        }
    }

    async deleteOne(req: Request, res: Response) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const userAccessLevels = req.tokenMeta.accessLevels;

            if (
                !(await this.accessLevelService.accessLevelsCanPerformAction(
                    userAccessLevels,
                    Permission.DELETE_SUBJECT,
                    req.tokenMeta.isManager
                ))
            ) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const docId = new Types.ObjectId(req.params.docId);
            const sub = await this.subjectService.findOne({
                _id: docId,
            });
            if (!sub) {
                throw new Error(`Subject doesn't exist`);
            }

            // there must be no material and prev exams that have this subject
            const ans = await Promise.all([
                this.materialService.findOne({ subject: docId }),
                this.previousExamService.findOne({ subject: docId }),
            ]);
            if (ans[0] || ans[1]) {
                throw new Error(
                    `There is still a material or previous exam that has this subject, please delete them first`
                );
            }
            const result = await this.subjectService.findOneAndDelete({
                _id: docId,
            });
            res.composer.success(result);
            await session.commitTransaction();
        } catch (error) {
            console.log(error);
            await session.abortTransaction();
            res.composer.badRequest(error.message);
        } finally {
            await session.endSession();
        }
    }
}
