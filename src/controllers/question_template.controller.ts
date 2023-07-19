import { inject, injectable } from "inversify";
import { Router } from "express";
import { Controller } from "./controller";
import { Request, Response, ServiceType } from "../types";
import {
    AccessLevelService,
    AuthService,
    ChapterService,
    QuestionTemplateService,
    QuizTemplateService,
    SubjectService,
} from "../services/index";
import _ from "lodash";
import { logger } from "../lib/logger";
import { CharStream, CommonTokenStream } from "antlr4";
import QuestionGrammarVisitor from "../lib/question-generation/QuestionGrammarVisitor";
import GrammarParser from "../lib/question-generation/GrammarParser";
import GrammarLexer from "../lib/question-generation/GrammarLexer";
import { Types } from "mongoose";
import { Permission } from "../models/access_level.model";
import {
    QuestionTemplateDocument,
    QuestionType,
} from "../models/question_template.model";

@injectable()
export class QuestionTemplateController extends Controller {
    public readonly router = Router();
    public readonly path = "/question_template/";

    constructor(
        @inject(ServiceType.Auth) private authService: AuthService,
        @inject(ServiceType.QuestionTemplate)
        private questionTemplateService: QuestionTemplateService,
        @inject(ServiceType.AccessLevel)
        private accessLevelService: AccessLevelService,
        @inject(ServiceType.Subject) private subjectService: SubjectService,
        @inject(ServiceType.QuizTemplate)
        private quizTemplateService: QuizTemplateService,
        @inject(ServiceType.Chapter) private chapterService: ChapterService
    ) {
        super();

        this.router.all("*", authService.authenticate());

        this.router.post("/test_code", this.testCode.bind(this));
        this.router.post(
            "/test_concrete_question/:questionId",
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
            const question =
                await this.questionTemplateService.getQuestionTemplateById(
                    questionId
                );
            const result =
                this.questionTemplateService.generateConcreteQuestion(question);
            res.composer.success(result);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    async previewQuestion(req: Request, res: Response) {
        try {
            const userAccessLevels = req.tokenMeta.accessLevels;

            if (
                !(await this.accessLevelService.accessLevelsCanPerformAction(
                    userAccessLevels,
                    Permission.CREATE_QUESTION_TEMPLATE,
                    req.tokenMeta.isManager
                ))
            ) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            req.body = _.pick(req.body, ["code", "questions", "description"]);
            if (!req.body.questions) {
                throw new Error(`Missing 'question' field`);
            }
            req.body.code = req.body.code ?? "";
            for (let i = 0; i < req.body.questions.length; i++) {
                req.body.questions[i] = _.pick(req.body.questions[i], [
                    "questionType",
                    "description",
                    "options",
                    "shuffleOptions",
                    "answerKey",
                    "answerKeys",
                    "answerField",
                    "matchCase",
                    "maximumError",
                    "explanation",
                ]);
                req.body.questions[i].description =
                    req.body.questions[i].description ?? "";
                req.body.questions[i].explanation =
                    req.body.questions[i].explanation ?? "";
                const type = req.body.questions[i].questionType as QuestionType;
                switch (type) {
                    case QuestionType.MULTIPLE_CHOICE_SINGLE_ANSWER: {
                        const [options, shuffleOptions, answerKey] = [
                            req.body.questions[i].options as string[],
                            req.body.questions[i].shuffleOptions as boolean,
                            req.body.questions[i].answerKey as number,
                        ];
                        if (
                            !options ||
                            shuffleOptions === undefined ||
                            answerKey === undefined
                        ) {
                            throw new Error(
                                `Missing options, shuffleOptions, or answerKey for multiple choice, single answer question`
                            );
                        }
                        if (answerKey < 0 || answerKey >= options.length) {
                            throw new Error(`Answer key out of bounds`);
                        }
                        options.forEach((option, index) => {
                            req.body.questions[i].options[index] = {
                                key: index,
                                description: option,
                            };
                        });
                        break;
                    }
                    case QuestionType.MULTIPLE_CHOICE_MULTIPLE_ANSWERS: {
                        const [options, shuffleOptions, answerKeys] = [
                            req.body.questions[i].options as string[],
                            req.body.questions[i].shuffleOptions as boolean,
                            req.body.questions[i].answerKeys as number[],
                        ];
                        if (
                            !options ||
                            shuffleOptions === undefined ||
                            answerKeys === undefined
                        ) {
                            throw new Error(
                                `Missing options, shuffleOptions, or answerKeys for multiple choice, multiple answers question`
                            );
                        }
                        answerKeys.forEach((key, keyIndex) => {
                            if (key < 0 || key >= options.length) {
                                throw new Error(
                                    `Answer key ${key} is out of bounds`
                                );
                            }
                            if (
                                answerKeys.some(
                                    (otherKey, otherIndex) =>
                                        otherKey === key &&
                                        otherIndex !== keyIndex
                                )
                            ) {
                                throw new Error(
                                    `Answer keys contain duplicates`
                                );
                            }
                        });
                        options.forEach((option, index) => {
                            req.body.questions[i].options[index] = {
                                key: index,
                                description: option,
                            };
                        });
                        break;
                    }
                    case QuestionType.TEXT: {
                        if (
                            req.body.questions[i].answerField === undefined ||
                            typeof req.body.questions[i].answerField !==
                                "string"
                        ) {
                            throw new Error(
                                `Question missing 'answerField' or 'answerField' is not a string`
                            );
                        }
                        if (req.body.questions[i].matchCase === undefined) {
                            throw new Error(`Question missing 'matchCase'`);
                        }
                        break;
                    }
                    case QuestionType.NUMBER: {
                        if (
                            req.body.questions[i].answerField === undefined ||
                            typeof req.body.questions[i].answerField !==
                                "string"
                        ) {
                            throw new Error(
                                `Question missing 'answerField' or 'answerField' is not a string`
                            );
                        }
                        if (req.body.questions[i].maximumError === undefined) {
                            throw new Error(`Question missing 'maximumError'`);
                        }
                        break;
                    }
                    default: {
                        throw new Error(
                            `questionType should be one of [${Object.values(
                                QuestionType
                            )}], received '${type}'`
                        );
                    }
                }
            }
            const questionTemplate = req.body as QuestionTemplateDocument;
            const result =
                this.questionTemplateService.generateConcreteQuestion(
                    questionTemplate
                );
            res.composer.success(result);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    async create(req: Request, res: Response) {
        try {
            const userAccessLevels = req.tokenMeta.accessLevels;

            if (
                !(await this.accessLevelService.accessLevelsCanPerformAction(
                    userAccessLevels,
                    Permission.CREATE_QUESTION_TEMPLATE,
                    req.tokenMeta.isManager
                ))
            ) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const userId = req.tokenMeta.userId;

            req.body = _.pick(req.body, [
                "name",
                "description",
                "questions",
                "code",
                "subject",
                "chapter",
            ]);
            req.body.code = req.body.code ?? "";

            const [subject, chapter, name] = [
                new Types.ObjectId(req.body.subject),
                new Types.ObjectId(req.body.chapter),
                req.body.name as string,
            ];
            if (!req.body.questions) {
                throw new Error(`Missing 'questions' field`);
            }
            if (!subject) {
                throw new Error(`Missing 'subject' field`);
            }
            if (!name) {
                throw new Error(`Missing 'name' field`);
            }
            if (chapter === undefined) {
                throw new Error(`Missing 'chapter' field`);
            }
            if (!(await this.subjectService.subjectExists(subject))) {
                throw new Error(`Subject doesn't exist`);
            }
            if (
                !(await this.chapterService.chapterIsChildOfSubject(
                    chapter,
                    subject
                ))
            ) {
                throw new Error(
                    `Chapter doesn't exist or does not belong to this subject`
                );
            }

            for (let i = 0; i < req.body.questions.length; i++) {
                req.body.questions[i] = _.pick(req.body.questions[i], [
                    "questionType",
                    "description",
                    "options",
                    "shuffleOptions",
                    "answerKey",
                    "answerKeys",
                    "answerField",
                    "matchCase",
                    "maximumError",
                    "explanation",
                ]);
                if (!req.body.questions[i].description) {
                    throw new Error(
                        `Missing description for question ${i + 1}`
                    );
                }
                req.body.questions[i].explanation =
                    req.body.questions[i].explanation ?? "";
                const type = req.body.questions[i].questionType as QuestionType;
                switch (type) {
                    case QuestionType.MULTIPLE_CHOICE_SINGLE_ANSWER: {
                        const [options, shuffleOptions, answerKey] = [
                            req.body.questions[i].options as string[],
                            req.body.questions[i].shuffleOptions as boolean,
                            req.body.questions[i].answerKey as number,
                        ];
                        if (
                            !options ||
                            shuffleOptions === undefined ||
                            answerKey === undefined
                        ) {
                            throw new Error(
                                `Missing options, shuffleOptions or answerKey for multiple choice, single answer question`
                            );
                        }
                        if (answerKey < 0 || answerKey >= options.length) {
                            throw new Error(`Answer key out of bounds`);
                        }
                        options.forEach((option, index) => {
                            req.body.questions[i].options[index] = {
                                key: index,
                                description: option,
                            };
                        });
                        break;
                    }
                    case QuestionType.MULTIPLE_CHOICE_MULTIPLE_ANSWERS: {
                        const [options, shuffleOptions, answerKeys] = [
                            req.body.questions[i].options as string[],
                            req.body.questions[i].shuffleOptions as boolean,
                            req.body.questions[i].answerKeys as number[],
                        ];
                        if (
                            !options ||
                            shuffleOptions === undefined ||
                            answerKeys === undefined
                        ) {
                            throw new Error(
                                `Missing options, shuffleOptions or answerKeys for multiple choice, multiple answers question`
                            );
                        }
                        answerKeys.forEach((key, keyIndex) => {
                            if (key < 0 || key >= options.length) {
                                throw new Error(
                                    `Answer key ${key} is out of bounds`
                                );
                            }
                            if (
                                answerKeys.some(
                                    (otherKey, otherIndex) =>
                                        otherKey === key &&
                                        otherIndex !== keyIndex
                                )
                            ) {
                                throw new Error(
                                    `Answer keys contain duplicates`
                                );
                            }
                        });
                        options.forEach((option, index) => {
                            req.body.questions[i].options[index] = {
                                key: index,
                                description: option,
                            };
                        });
                        break;
                    }
                    case QuestionType.TEXT: {
                        if (
                            req.body.questions[i].answerField === undefined ||
                            typeof req.body.questions[i].answerField !==
                                "string"
                        ) {
                            throw new Error(
                                `Question missing 'answerField' or 'answerField' is not a string`
                            );
                        }
                        if (req.body.questions[i].matchCase === undefined) {
                            throw new Error(`Question missing 'matchCase'`);
                        }
                        break;
                    }
                    case QuestionType.NUMBER: {
                        if (
                            req.body.questions[i].answerField === undefined ||
                            typeof req.body.questions[i].answerField !==
                                "string"
                        ) {
                            throw new Error(
                                `Question missing 'answerField' or 'answerField' is not a string`
                            );
                        }
                        if (req.body.questions[i].maximumError === undefined) {
                            throw new Error(`Question missing 'maximumError'`);
                        }
                        break;
                    }
                    default: {
                        throw new Error(
                            `questionType should be one of [${Object.values(
                                QuestionType
                            )}], received '${type}'`
                        );
                    }
                }
            }

            const result = await this.questionTemplateService.create(
                userId,
                req.body
            );
            res.composer.success(result);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    async getAll(req: Request, res: Response) {
        try {
            const userAccessLevels = req.tokenMeta.accessLevels;

            if (
                !(await this.accessLevelService.accessLevelsCanPerformAction(
                    userAccessLevels,
                    Permission.VIEW_QUESTION_TEMPLATE,
                    req.tokenMeta.isManager
                ))
            ) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const result =
                await this.questionTemplateService.getAllQuestionTemplates();
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
                    Permission.DELETE_QUESTION_TEMPLATE,
                    req.tokenMeta.isManager
                ))
            ) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const questionId = new Types.ObjectId(req.params.questionId);
            const question =
                await this.questionTemplateService.getQuestionTemplateById(
                    questionId
                );

            if (!question) {
                throw new Error(`Question template does not exist`);
            }

            // check if any quiz templates or exam templates that use this question
            const [quizTemplateWithThisQuestion] = await Promise.all([
                this.quizTemplateService.checkQuizTemplateWithQuestion(
                    questionId
                ),
            ]);

            if (quizTemplateWithThisQuestion) {
                throw new Error(
                    `There are quiz templates that contain this question. Please delete them first`
                );
            }

            const result = await this.questionTemplateService.markAsDeleted(
                questionId
            );
            res.composer.success(result);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }
}
