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
    ChapterService,
    QuestionService,
    QuizService,
} from "../services/index";
import { FilterQuery, Types } from "mongoose";
import { logger } from "../lib/logger";
import { SubjectDocument } from "../models/subject.model";
import { DEFAULT_PAGINATION_SIZE } from "../config";

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
        @inject(ServiceType.Question) private questionService: QuestionService,
        @inject(ServiceType.Quiz) private quizService: QuizService,
        @inject(ServiceType.Chapter) private chapterService: ChapterService
    ) {
        super();

        this.router.all("*", this.authService.authenticate(false));
        this.router.get("/", this.getAll.bind(this));
        this.router.get("/:subjectId", this.getById.bind(this));
    }

    async getById(req: Request, res: Response) {
        try {
            const subjectId = new Types.ObjectId(req.params.subjectId);
            const subject = await this.subjectService.getSubjectById(
                subjectId,
                {
                    createdBy: 0,
                    createdAt: 0,
                    lastUpdatedAt: 0,
                    __v: 0,
                }
            );

            if (!subject) {
                throw new Error(`Subject does not exist`);
            }

            res.composer.success(subject);
        } catch (error) {
            logger.error(error.message);
            console.error(error);
            res.composer.badRequest(error.message);
        }
    }

    async getAll(req: Request, res: Response) {
        try {
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
                        createdBy: 0,
                        createdAt: 0,
                        lastUpdatedAt: 0,
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
                        createdBy: 0,
                        createdAt: 0,
                        lastUpdatedAt: 0,
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
}
