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
    QuestionTemplateService,
    QuizTemplateService,
} from "../services/index";
import mongoose, { Types } from "mongoose";
import _ from "lodash";
import { Permission } from "../models/access_level.model";
import { logger } from "../lib/logger";

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
        private accessLevelService: AccessLevelService,
        @inject(ServiceType.QuestionTemplate)
        private questionTemplateService: QuestionTemplateService,
        @inject(ServiceType.QuizTemplate)
        private quizTemplateService: QuizTemplateService
    ) {
        super();

        this.router.get("/", this.getAllSubjects.bind(this));

        this.router.all("*", authService.authenticate());
        this.router.post("/", this.create.bind(this));
        this.router.patch("/:docId", this.editSubject.bind(this));
        this.router.delete("/:docId", this.delete.bind(this));
    }

    async create(req: Request, res: Response) {
        try {
            const { userId } = req.tokenMeta;
            const { name, description = "" } = req.body;

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
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    async getAllSubjects(req: Request, res: Response) {
        try {
            const ans = await this.subjectService.find({
                deletedAt: {
                    $exists: false,
                },
            });
            res.composer.success(ans);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    async editSubject(req: Request, res: Response) {
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
                deletedAt: { $exists: false },
            });
            if (!doc) {
                throw new Error(`Subject doesn't exist or has been deleted`);
            }

            const info = _.pick(req.body, ["name", "description"]);

            const result = await this.subjectService.findOneAndUpdate(
                { _id: docId },
                {
                    ...info,
                    lastUpdatedAt: Date.now(),
                },
                {
                    new: true,
                }
            );
            res.composer.success(result);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    async delete(req: Request, res: Response) {
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
                deletedAt: { $exists: false },
            });
            if (!sub) {
                throw new Error(`Subject doesn't exist or has been deleted`);
            }

            // check if anything holds a reference to this subject
            const [
                materialWithThisSubject,
                previousExamWithThisSubject,
                questionTemplateWithThisSubject,
                quizTemplateWithThisSubject,
            ] = await Promise.all([
                (async () => {
                    return (
                        (await this.materialService.findOne({
                            subject: docId,
                            deletedAt: { $exists: false },
                        })) != null
                    );
                })(),
                (async () => {
                    return (
                        (await this.previousExamService.findOne({
                            subject: docId,
                            deletedAt: { $exists: false },
                        })) != null
                    );
                })(),
                (async () => {
                    return (
                        (await this.questionTemplateService.findOne({
                            subject: docId,
                            deletedAt: { $exists: false },
                        })) != null
                    );
                })(),
                (async () => {
                    return (
                        (await this.quizTemplateService.findOne({
                            subject: docId,
                            deletedAt: { $exists: false },
                        })) != null
                    );
                })(),
            ]);
            if (materialWithThisSubject) {
                throw new Error(
                    `There are still materials that belong to this subject. Please delete them first`
                );
            }
            if (previousExamWithThisSubject) {
                throw new Error(
                    `There are still previous exams that belong to this subject. Please delete them first`
                );
            }
            if (questionTemplateWithThisSubject) {
                throw new Error(
                    `There are still question templates that belong to this subject. Please delete them first`
                );
            }
            if (quizTemplateWithThisSubject) {
                throw new Error(
                    `There are still quiz templates that belong to this subject. Please delete them first`
                );
            }

            const result = await this.subjectService.markAsDeleted(docId);
            res.composer.success(result);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }
}
