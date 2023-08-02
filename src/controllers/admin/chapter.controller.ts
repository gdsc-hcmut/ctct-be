import { Router } from "express";
import { Controller } from "../controller";
import { Request, Response, ServiceType } from "../../types";
import {
    AccessLevelService,
    AuthService,
    ChapterService,
    MaterialService,
    QuestionService,
    QuizService,
    SubjectService,
} from "../../services/index";
import { inject } from "inversify";
import { FilterQuery, Types } from "mongoose";
import { Permission } from "../../models/access_level.model";
import { logger } from "../../lib/logger";
import _ from "lodash";
import { ChapterDocument } from "../../models/chapter.model";
import { DEFAULT_PAGINATION_SIZE } from "../../config";

export class AdminChapterController extends Controller {
    public readonly router = Router();
    public readonly path = "/chapter";

    constructor(
        @inject(ServiceType.Auth) private authService: AuthService,
        @inject(ServiceType.AccessLevel)
        private accessLevelService: AccessLevelService,
        @inject(ServiceType.Subject) private subjectService: SubjectService,
        @inject(ServiceType.Chapter) private chapterService: ChapterService,
        @inject(ServiceType.Material) private materialService: MaterialService,
        @inject(ServiceType.Question) private questionService: QuestionService,
        @inject(ServiceType.Quiz) private quizService: QuizService
    ) {
        super();

        this.router.all("*", this.authService.authenticate());

        this.router.post("/", this.create.bind(this));
        this.router.patch("/:chapterId", this.edit.bind(this));
        this.router.delete("/:chapterId", this.delete.bind(this));

        this.router.get("/", this.getAll.bind(this));
        this.router.get("/:chapterId", this.getById.bind(this));
    }

    async create(req: Request, res: Response) {
        try {
            const { userId } = req.tokenMeta;
            const { name, description = "" } = req.body;
            const subject = new Types.ObjectId(req.body.subject);
            const canPerform = this.accessLevelService.permissionChecker(
                req.tokenMeta
            );

            const canCreate = await canPerform(Permission.ADMIN_CREATE_CHAPTER);
            if (!canCreate) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const subjectExists = await this.subjectService.subjectExists(
                subject
            );
            if (!subjectExists) {
                throw new Error(`Subject does not exist`);
            }

            const result = await this.chapterService.create(
                name,
                subject,
                description,
                userId
            );
            res.composer.success(result);
        } catch (error) {
            logger.error(error.message);
            console.error(error);
            res.composer.badRequest(error.message);
        }
    }

    async edit(req: Request, res: Response) {
        try {
            const chapterId = new Types.ObjectId(req.params.chapterId);
            const canPerform = this.accessLevelService.permissionChecker(
                req.tokenMeta
            );

            const canEdit = await canPerform(Permission.ADMIN_EDIT_CHAPTER);
            if (!canEdit) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const info = _.pick(req.body, ["name", "description"]);
            const result = await this.chapterService.editOneChapter(
                chapterId,
                info
            );
            if (!result) {
                throw new Error(`The requested chapter is not found`);
            }
            res.composer.success(result);
        } catch (error) {
            logger.error(error.message);
            console.error(error);
            res.composer.badRequest(error.message);
        }
    }

    async delete(req: Request, res: Response) {
        try {
            const chapterId = new Types.ObjectId(req.params.chapterId);
            const canPerform = this.accessLevelService.permissionChecker(
                req.tokenMeta
            );

            const canDelete = await canPerform(Permission.ADMIN_DELETE_CHAPTER);
            if (!canDelete) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const [
                materialWithThisChapter,
                questionWithThisChapter,
                quizWithThisChapter,
            ] = await Promise.all([
                this.materialService.materialWithChapterExists(chapterId),
                this.questionService.questionWithChapterExists(chapterId),
                this.quizService.quizWithChapterExists(chapterId),
            ]);

            if (materialWithThisChapter) {
                throw new Error(
                    `This chapter is referenced by some materials. Please delete them first`
                );
            }
            if (questionWithThisChapter) {
                throw new Error(
                    `This chapter is referenced by some question. Please delete them first`
                );
            }
            if (quizWithThisChapter) {
                throw new Error(
                    `This chapter is referenced by some quiz. Please delete them first`
                );
            }

            const result = await this.chapterService.markAsDeleted(chapterId);
            if (!result) {
                throw new Error(`Chapter not found`);
            }
            res.composer.success(result);
        } catch (error) {
            logger.error(error.message);
            console.error(error);
            res.composer.badRequest(error.message);
        }
    }

    async getAll(req: Request, res: Response) {
        try {
            const canPerform = this.accessLevelService.permissionChecker(
                req.tokenMeta
            );
            const canView = await canPerform(Permission.ADMIN_VIEW_CHAPTER);
            if (!canView) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const query: FilterQuery<ChapterDocument> = {};
            if (req.query.subject) {
                query.subject = new Types.ObjectId(req.query.subject as string);
            }
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
                const result = await this.chapterService.getPopulated(
                    query,
                    {
                        __v: 0,
                    },
                    ["subject"]
                );
                res.composer.success({
                    total: result.length,
                    result,
                });
            } else {
                const [total, result] = await this.chapterService.getPaginated(
                    query,
                    {
                        __v: 0,
                    },
                    ["subject"],
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
            console.error(error);
            res.composer.badRequest(error.message);
        }
    }

    async getById(req: Request, res: Response) {
        try {
            const chapterId = new Types.ObjectId(req.params.chapterId);
            const canPerform = this.accessLevelService.permissionChecker(
                req.tokenMeta
            );

            const canView = await canPerform(Permission.ADMIN_VIEW_CHAPTER);
            if (!canView) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const result = await this.chapterService.getByIdPopulated(
                chapterId,
                {
                    __v: 0,
                },
                ["subject"]
            );

            if (!result) {
                throw new Error(`Chapter not found`);
            }

            res.composer.success(result);
        } catch (error) {
            logger.error(error.message);
            console.error(error);
            res.composer.badRequest(error.message);
        }
    }
}
