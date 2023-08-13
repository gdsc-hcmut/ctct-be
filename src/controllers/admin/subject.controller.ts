import { Router } from "express";
import { Controller } from "../controller";
import { inject, injectable } from "inversify";
import { Request, Response, ServiceType } from "../../types";
import {
    AccessLevelService,
    AuthService,
    ChapterService,
    MaterialService,
    PreviousExamService,
    QuestionService,
    QuizService,
    SubjectService,
} from "../../services/index";
import { Permission } from "../../models/access_level.model";
import { logger } from "../../lib/logger";
import { FilterQuery, Types } from "mongoose";
import { SubjectDocument } from "../../models/subject.model";
import { DEFAULT_PAGINATION_SIZE } from "../../config";
import _ from "lodash";

@injectable()
export class AdminSubjectController extends Controller {
    public readonly router = Router();
    public readonly path = "/subject";

    constructor(
        @inject(ServiceType.Auth) private authService: AuthService,
        @inject(ServiceType.Subject) private subjectService: SubjectService,
        @inject(ServiceType.AccessLevel)
        private accessLevelService: AccessLevelService,
        @inject(ServiceType.Material) private materialService: MaterialService,
        @inject(ServiceType.PreviousExam)
        private previousExamService: PreviousExamService,
        @inject(ServiceType.Question) private questionService: QuestionService,
        @inject(ServiceType.Quiz) private quizService: QuizService,
        @inject(ServiceType.Chapter) private chapterService: ChapterService
    ) {
        super();

        this.router.all("*", this.authService.authenticate());

        this.router.get("/", this.getAll.bind(this));
        this.router.get("/:subjectId", this.getById.bind(this));

        this.router.post("/", this.create.bind(this));
        this.router.patch("/:subjectId", this.edit.bind(this));
        this.router.delete("/:subjectId", this.delete.bind(this));
    }

    async create(req: Request, res: Response) {
        try {
            const canPerform = this.accessLevelService.permissionChecker(
                req.tokenMeta
            );
            const canCreateSubject = await canPerform(
                Permission.ADMIN_CREATE_SUBJECT
            );
            if (!canCreateSubject) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const { userId } = req.tokenMeta;
            const { name, description = "" } = req.body;

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

    async getAll(req: Request, res: Response) {
        try {
            const canPerform = this.accessLevelService.permissionChecker(
                req.tokenMeta
            );
            const canView = await canPerform(Permission.ADMIN_VIEW_SUBJECT);
            if (!canView) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const query: FilterQuery<SubjectDocument> = {};
            if (req.query.name) {
                query.name = {
                    $regex: decodeURIComponent(req.query.name as string),
                };
            }

            const pageSize: number = req.query.pageSize
                ? parseInt(req.query.pageSize as string)
                : DEFAULT_PAGINATION_SIZE;
            const pageNumber: number = req.query.pageNumber
                ? parseInt(req.query.pageNumber as string)
                : 1;

            if (req.query.pagination === "false") {
                const result = await this.subjectService.getPopulated(
                    query,
                    {
                        __v: 0,
                    },
                    []
                );
                res.composer.success({
                    total: result.length,
                    result,
                });
            } else {
                const [total, result] = await this.subjectService.getPaginated(
                    query,
                    {
                        __v: 0,
                    },
                    [],
                    pageSize,
                    pageNumber
                );
                res.composer.success({
                    total,
                    pageCount: Math.max(Math.ceil(total / pageSize), 1),
                    pageSize,
                    result,
                });
            }
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    async getById(req: Request, res: Response) {
        try {
            const canPerform = this.accessLevelService.permissionChecker(
                req.tokenMeta
            );
            const canView = await canPerform(Permission.ADMIN_VIEW_SUBJECT);
            if (!canView) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const subjectId = new Types.ObjectId(req.params.subjectId);
            const subject = await this.subjectService.getSubjectById(
                subjectId,
                {
                    __v: 0,
                }
            );

            if (!subject) {
                throw new Error(`Subject doesn't exist or has been deleted`);
            }

            res.composer.success(subject);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    async edit(req: Request, res: Response) {
        try {
            const canPerform = this.accessLevelService.permissionChecker(
                req.tokenMeta
            );
            const canEditSubject = await canPerform(
                Permission.ADMIN_EDIT_SUBJECT
            );
            if (!canEditSubject) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const subjectId = new Types.ObjectId(req.params.subjectId);
            const subject = await this.subjectService.getSubjectById(subjectId);

            if (!subject) {
                throw new Error(`Subject doesn't exist or has been deleted`);
            }

            const info = _.pick(req.body, ["name", "description"]);

            const result = await this.subjectService.editOneSubject(
                subjectId,
                info,
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
            const canPerform = this.accessLevelService.permissionChecker(
                req.tokenMeta
            );
            const canDeleteSubject = await canPerform(
                Permission.ADMIN_DELETE_SUBJECT
            );
            if (!canDeleteSubject) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const subjectId = new Types.ObjectId(req.params.subjectId);
            const subject = await this.subjectService.getSubjectById(subjectId);

            if (!subject) {
                throw new Error(`Subject doesn't exist or has been deleted`);
            }

            // check if anything holds a reference to this subject
            const [
                materialWithThisSubject,
                previousExamWithThisSubject,
                questionWithThisSubject,
                quizWithThisSubject,
                chapterWithThisSubject,
            ] = await Promise.all([
                this.materialService.materialWithSubjectExists(subjectId),
                this.previousExamService.previousExamWithSubjectExists(
                    subjectId
                ),
                this.questionService.questionWithSubjectExists(subjectId),
                this.quizService.quizWithSubjectExists(subjectId),
                this.chapterService.chapterWithSubjectExists(subjectId),
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
            if (questionWithThisSubject) {
                throw new Error(
                    `There are still question that belong to this subject. Please delete them first`
                );
            }
            if (quizWithThisSubject) {
                throw new Error(
                    `There are still quiz that belong to this subject. Please delete them first`
                );
            }
            if (chapterWithThisSubject) {
                throw new Error(
                    `There are still chapters that belong to this subject. Please delete them first`
                );
            }

            const result = await this.subjectService.markAsDeleted(subjectId);
            res.composer.success(result);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }
}
