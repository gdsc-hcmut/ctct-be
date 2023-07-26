import { Router } from "express";
import { inject, injectable } from "inversify";

import { Request, Response, ServiceType } from "../types";
import { Controller } from "./controller";
import {
    AccessLevelService,
    AuthService,
    MaterialService,
    QuestionTemplateService,
    QuizTemplateService,
    SubjectService,
} from "../services";
import { ChapterService } from "../services/index";
import { logger } from "../lib/logger";
import { FilterQuery, Types } from "mongoose";
import { Permission } from "../models/access_level.model";
import _ from "lodash";
import { ChapterDocument } from "../models/chapter.model";
import { DEFAULT_PAGINATION_SIZE } from "../config";

@injectable()
export class ChapterController extends Controller {
    public readonly router = Router();
    public readonly path = "/chapter";

    constructor(
        @inject(ServiceType.Auth) private authService: AuthService,
        @inject(ServiceType.Chapter) private chapterService: ChapterService,
        @inject(ServiceType.AccessLevel)
        private accessLevelService: AccessLevelService,
        @inject(ServiceType.Subject) private subjectService: SubjectService,
        @inject(ServiceType.Material) private materialService: MaterialService,
        @inject(ServiceType.QuestionTemplate)
        private questionTemplateService: QuestionTemplateService,
        @inject(ServiceType.QuizTemplate)
        private quizTemplateService: QuizTemplateService
    ) {
        super();

        this.router.all("*", this.authService.authenticate(false));

        this.router.all("*", this.authService.authenticate());
        this.router.post("/", this.create.bind(this));
        this.router.get("/", this.getAll.bind(this));
        this.router.patch("/:chapterId", this.edit.bind(this));
        this.router.delete("/:chapterId", this.delete.bind(this));
    }

    async create(req: Request, res: Response) {
        try {
            const { userId } = req.tokenMeta;
            const { name, description = "" } = req.body;
            const subject = new Types.ObjectId(req.body.subject);
            const canPerform = this.accessLevelService.permissionChecker(
                req.tokenMeta
            );

            if (!(await canPerform(Permission.ADMIN_CREATE_CHAPTER))) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            if (!(await this.subjectService.subjectExists(subject))) {
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

            if (!(await canPerform(Permission.ADMIN_EDIT_CHAPTER))) {
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

            if (!(await canPerform(Permission.ADMIN_DELETE_CHAPTER))) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const [
                materialWithThisChapter,
                questionTemplateWithThisChapter,
                quizTemplateWithThisChapter,
            ] = await Promise.all([
                this.materialService.materialWithChapterExists(chapterId),
                this.questionTemplateService.questionTemplateWithChapterExists(
                    chapterId
                ),
                this.quizTemplateService.quizTemplateWithChapterExists(
                    chapterId
                ),
            ]);

            if (materialWithThisChapter) {
                throw new Error(
                    `This chapter is referenced by some materials. Please delete them first`
                );
            }
            if (questionTemplateWithThisChapter) {
                throw new Error(
                    `This chapter is referenced by some question templates. Please delete them first`
                );
            }
            if (quizTemplateWithThisChapter) {
                throw new Error(
                    `This chapter is referenced by some quiz templates. Please delete them first`
                );
            }

            const result = await this.chapterService.markAsDeleted(chapterId);
            res.composer.success(result);
        } catch (error) {
            logger.error(error.message);
            console.error(error);
            res.composer.badRequest(error.message);
        }
    }

    async getAll(req: Request, res: Response) {
        try {
            const query: FilterQuery<ChapterDocument> = {};
            if (req.query.subject) {
                query.subject = new Types.ObjectId(req.query.subject as string);
            }
            if (req.query.name) {
                req.query.name = {
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
                const result = await this.chapterService.getPopulated(query, [
                    "subject",
                ]);
                res.composer.success({
                    total: result.length,
                    result,
                });
            } else {
                const [total, result] = await this.chapterService.getPaginated(
                    query,
                    ["subject"],
                    pageSize,
                    pageNumber
                );

                res.composer.success({
                    total,
                    pageCount: Math.ceil(total / pageSize),
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
}
