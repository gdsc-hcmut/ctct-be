import { inject, injectable } from "inversify";
import { Controller } from "../controller";
import { Router } from "express";
import {
    AccessLevelService,
    AuthService,
    ChapterService,
    QuestionService,
    QuizService,
    SubjectService,
} from "../../services";
import { Request, Response, ServiceType } from "../../types";
import { CharStream, CommonTokenStream } from "antlr4";
import GrammarLexer from "../../lib/question-generation/GrammarLexer";
import GrammarParser from "../../lib/question-generation/GrammarParser";
import QuestionGrammarVisitor from "../../lib/question-generation/QuestionGrammarVisitor";
import { logger } from "../../lib/logger";
import { FilterQuery, Types } from "mongoose";
import { Permission } from "../../models/access_level.model";
import { CreateQuestionDto, PreviewQuestionDto } from "../../lib/dto";
import { QuestionDocument, QuestionType } from "../../models/question.model";
import { DEFAULT_PAGINATION_SIZE } from "../../config";

@injectable()
export class AdminQuestionController extends Controller {
    public readonly router = Router();
    public readonly path = "/question";

    constructor(
        @inject(ServiceType.Auth) private authService: AuthService,
        @inject(ServiceType.Question) private questionService: QuestionService,
        @inject(ServiceType.AccessLevel)
        private accessLevelService: AccessLevelService,
        @inject(ServiceType.Subject) private subjectService: SubjectService,
        @inject(ServiceType.Chapter) private chapterService: ChapterService,
        @inject(ServiceType.Quiz) private quizService: QuizService
    ) {
        super();

        this.router.all("*", this.authService.authenticate());

        this.router.post("/test_code", this.testCode.bind(this));
        this.router.post(
            "/:questionId/test_concrete_question",
            this.testConcreteQuestionGeneration.bind(this)
        );
        this.router.post("/preview", this.previewQuestion.bind(this));
        this.router.post("/", this.create.bind(this));
        this.router.get("/", this.getAll.bind(this));
        this.router.delete("/:questionId", this.delete.bind(this));
    }

    async testCode(req: Request, res: Response) {
        try {
            if (!req.tokenMeta.isManager) {
                throw new Error(`Missing manager permission`);
            }
            if (!req.body.code) {
                throw new Error(`Missing code`);
            }
            const code = req.body.code as string;
            const charStream = new CharStream(code);
            const lexer = new GrammarLexer(charStream);
            const tokenStream = new CommonTokenStream(lexer);
            const tree = new GrammarParser(tokenStream);

            const visitor = new QuestionGrammarVisitor();
            visitor.visitProg(tree.prog());

            const symbols = visitor.getSymbols();
            logger.debug(symbols);
            res.composer.success(Object.fromEntries(symbols));
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    async testConcreteQuestionGeneration(req: Request, res: Response) {
        try {
            if (!req.tokenMeta.isManager) {
                throw new Error(`Missing manager permission`);
            }
            const questionId = new Types.ObjectId(req.params.questionId);
            const question = await this.questionService.getById(questionId);
            const result =
                this.questionService.generateConcreteQuestion(question);
            res.composer.success(result);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    async previewQuestion(req: Request, res: Response) {
        try {
            const canPerform = this.accessLevelService.permissionChecker(
                req.tokenMeta
            );
            const canCreateQuestion = await canPerform(
                Permission.ADMIN_CREATE_QUESTION
            );
            if (!canCreateQuestion) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const info: PreviewQuestionDto = {
                name: req.body.name || "",
                code: req.body.code || "",
                type: req.body.type,
                description: req.body.description || "",
                options: req.body.options,
                shuffleOptions: req.body.shuffleOptions,
                answerKeys: req.body.answerKeys,
                answerField: req.body.answerField,
                matchCase: req.body.matchCase,
                maximumError: req.body.maximumError,
                explanation: req.body.explanation || "",
            };

            switch (info.type) {
                case QuestionType.MULTIPLE_CHOICE_SINGLE_ANSWER: {
                    if (
                        !info.options ||
                        info.shuffleOptions === undefined ||
                        info.answerKeys === undefined
                    ) {
                        throw new Error(
                            `Missing options, shuffleOptions, or answerKeys for multiple choice, single answer question`
                        );
                    }
                    if (
                        !(
                            info.answerKeys.length === 1 &&
                            info.answerKeys[0] >= 0 &&
                            info.answerKeys[0] < info.options.length
                        )
                    ) {
                        throw new Error(
                            `answerKeys must be of length 1 and within bounds`
                        );
                    }
                    break;
                }
                case QuestionType.MULTIPLE_CHOICE_MULTIPLE_ANSWERS: {
                    if (
                        !info.options ||
                        info.shuffleOptions === undefined ||
                        info.answerKeys === undefined
                    ) {
                        throw new Error(
                            `Missing options, shuffleOptions, or answerKeys for multiple choice, multiple answers question`
                        );
                    }
                    info.answerKeys.forEach((key, keyIndex) => {
                        if (key < 0 || key >= info.options.length) {
                            throw new Error(
                                `Answer key ${key} is out of bounds`
                            );
                        }
                        if (
                            info.answerKeys.some(
                                (otherKey, otherIndex) =>
                                    otherKey === key && otherIndex !== keyIndex
                            )
                        ) {
                            throw new Error(`Answer keys contain duplicates`);
                        }
                    });
                    break;
                }
                case QuestionType.TEXT: {
                    if (info.answerField === undefined) {
                        throw new Error(`Question missing 'answerField'`);
                    }
                    if (info.matchCase === undefined) {
                        throw new Error(`Question missing 'matchCase'`);
                    }
                    break;
                }
                case QuestionType.NUMBER: {
                    if (info.answerField === undefined) {
                        throw new Error(
                            `Question missing 'answerField' or 'answerField' is not a string`
                        );
                    }
                    if (info.maximumError === undefined) {
                        throw new Error(`Question missing 'maximumError'`);
                    }
                    break;
                }
                default: {
                    throw new Error(
                        `type should be one of [${Object.values(
                            QuestionType
                        )}], received '${info.type}'`
                    );
                }
            }
            const result = this.questionService.previewQuestion(info);
            res.composer.success(result);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    async create(req: Request, res: Response) {
        try {
            const canPerform = this.accessLevelService.permissionChecker(
                req.tokenMeta
            );
            const canCreateQuestion = await canPerform(
                Permission.ADMIN_CREATE_QUESTION
            );
            if (!canCreateQuestion) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }
            const { userId } = req.tokenMeta;

            const info: CreateQuestionDto = {
                name: req.body.name || "",
                code: req.body.code || "",
                subject: new Types.ObjectId(req.body.subject),
                chapter: new Types.ObjectId(req.body.chapter),
                type: req.body.type,
                description: req.body.description || "",
                options: req.body.options,
                shuffleOptions: req.body.shuffleOptions,
                answerKeys: req.body.answerKeys,
                answerField: req.body.answerField,
                matchCase: req.body.matchCase,
                maximumError: req.body.maximumError,
                explanation: req.body.explanation || "",
            };

            if (info.name.trim().length === 0) {
                throw new Error(`'name' is missing or is an empty string`);
            }

            const subjectExists = await this.subjectService.subjectExists(
                info.subject
            );
            const chapterIsChildOfSubject =
                await this.chapterService.isChildOfSubject(
                    info.chapter,
                    info.subject
                );
            if (!subjectExists) {
                throw new Error(`Subject doesn't exist`);
            }
            if (!chapterIsChildOfSubject) {
                throw new Error(
                    `Chapter doesn't exist or does not belong to this subject`
                );
            }

            switch (info.type) {
                case QuestionType.MULTIPLE_CHOICE_SINGLE_ANSWER: {
                    if (
                        !info.options ||
                        info.shuffleOptions === undefined ||
                        info.answerKeys === undefined
                    ) {
                        throw new Error(
                            `Missing options, shuffleOptions or answerKeys for multiple choice, single answer question`
                        );
                    }
                    if (
                        !(
                            info.answerKeys.length === 1 &&
                            info.answerKeys[0] >= 0 &&
                            info.answerKeys[0] < info.options.length
                        )
                    ) {
                        throw new Error(
                            `answerKeys must be of length 1 and within bounds`
                        );
                    }
                    break;
                }
                case QuestionType.MULTIPLE_CHOICE_MULTIPLE_ANSWERS: {
                    if (
                        !info.options ||
                        info.shuffleOptions === undefined ||
                        info.answerKeys === undefined
                    ) {
                        throw new Error(
                            `Missing options, shuffleOptions or answerKeys for multiple choice, multiple answers question`
                        );
                    }
                    info.answerKeys.forEach((key, keyIndex) => {
                        if (key < 0 || key >= info.options.length) {
                            throw new Error(
                                `Answer key ${key} is out of bounds`
                            );
                        }
                        if (
                            info.answerKeys.some(
                                (otherKey, otherIndex) =>
                                    otherKey === key && otherIndex !== keyIndex
                            )
                        ) {
                            throw new Error(`Answer keys contain duplicates`);
                        }
                    });
                    break;
                }
                case QuestionType.TEXT: {
                    if (info.answerField === undefined) {
                        throw new Error(
                            `Question missing 'answerField' or 'answerField' is not a string`
                        );
                    }
                    if (info.matchCase === undefined) {
                        throw new Error(`Question missing 'matchCase'`);
                    }
                    break;
                }
                case QuestionType.NUMBER: {
                    if (info.answerField === undefined) {
                        throw new Error(
                            `Question missing 'answerField' or 'answerField' is not a string`
                        );
                    }
                    if (info.maximumError === undefined) {
                        throw new Error(`Question missing 'maximumError'`);
                    }
                    break;
                }
                default: {
                    throw new Error(
                        `type should be one of [${Object.values(
                            QuestionType
                        )}], received '${info.type}'`
                    );
                }
            }

            const result = await this.questionService.create(userId, info);
            res.composer.success(result);
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
            const canView = await canPerform(Permission.ADMIN_VIEW_QUESTION);
            if (!canView) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const query: FilterQuery<QuestionDocument> = {};

            if (req.query.subject) {
                query.subject = new Types.ObjectId(req.query.subject as string);
            }
            if (req.query.chapter) {
                query.chapter = new Types.ObjectId(req.query.chapter as string);
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
                const result = await this.questionService.getPopulated(query, [
                    "subject",
                    "chapter",
                ]);
                res.composer.success({
                    total: result.length,
                    result,
                });
            } else {
                const [total, result] = await this.questionService.getPaginated(
                    query,
                    ["subject", "chapter"],
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

    async delete(req: Request, res: Response) {
        try {
            const canPerform = this.accessLevelService.permissionChecker(
                req.tokenMeta
            );
            const canDelete = await canPerform(
                Permission.ADMIN_DELETE_QUESTION
            );
            if (!canDelete) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const questionId = new Types.ObjectId(req.params.questionId);
            const question = await this.questionService.getById(questionId);

            if (!question) {
                throw new Error(`Question does not exist`);
            }

            // check if any quiz or exam that use this question
            const [quizWithThisQuestion] = await Promise.all([
                this.quizService.checkQuizWithQuestion(questionId),
            ]);

            if (quizWithThisQuestion) {
                throw new Error(
                    `There are quiz that contain this question. Please delete them first`
                );
            }

            const result = await this.questionService.markAsDeleted(questionId);
            if (!result) {
                throw new Error(`Question not found`);
            }
            res.composer.success(result);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }
}
