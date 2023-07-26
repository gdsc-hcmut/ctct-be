import { injectable } from "inversify";
import { logger } from "../lib/logger";
import { FilterQuery, QueryOptions, Types } from "mongoose";
import QuestionTemplateModel, {
    ConcreteQuestion,
    QuestionTemplateDocument,
    QuestionType,
} from "../models/question_template.model";
import { CharStream, CommonTokenStream } from "antlr4";
import GrammarLexer from "../lib/question-generation/GrammarLexer";
import GrammarParser from "../lib/question-generation/GrammarParser";
import QuestionGrammarVisitor from "../lib/question-generation/QuestionGrammarVisitor";
import Mustache from "mustache";
import _ from "lodash";

@injectable()
export class QuestionTemplateService {
    constructor() {
        logger.info("[QuestionTemplate] Initializing...");
    }

    async create(userId: Types.ObjectId, data: any) {
        /**
         * data should include metadata (as indicated by the model)
         * except createdBy and createdAt (automatically generated)
         */
        const now = Date.now();
        return (
            await QuestionTemplateModel.create([
                {
                    ...data,
                    createdAt: now,
                    createdBy: userId,
                    lastUpdatedAt: now,
                },
            ])
        )[0];
    }

    generateConcreteQuestion(questionTemplate: QuestionTemplateDocument) {
        const result: ConcreteQuestion = {
            subQuestions: [],
        };

        const charStream = new CharStream(questionTemplate.code);
        const lexer = new GrammarLexer(charStream);
        const tokenStream = new CommonTokenStream(lexer);
        const parser = new GrammarParser(tokenStream);
        const visitor = new QuestionGrammarVisitor();

        visitor.visitProg(parser.prog());
        const symbols = Object.fromEntries(visitor.getSymbols());

        if (questionTemplate.description !== undefined) {
            result.description = Mustache.render(
                questionTemplate.description,
                symbols
            );
        }

        for (const question of questionTemplate.subQuestions) {
            switch (question.type) {
                case QuestionType.MULTIPLE_CHOICE_SINGLE_ANSWER: {
                    let options = question.options.map((opt) => ({
                        description: Mustache.render(opt.description, symbols),
                        key: opt.key,
                    }));

                    if (question.shuffleOptions) {
                        options = _.shuffle(options);
                    }

                    result.subQuestions.push({
                        type: question.type,
                        description: Mustache.render(
                            question.description,
                            symbols
                        ),
                        options: options,
                        answerKey: question.answerKey,
                        explanation: Mustache.render(
                            question.explanation,
                            symbols
                        ),
                        isCorrect: false,
                    });
                    break;
                }
                case QuestionType.MULTIPLE_CHOICE_MULTIPLE_ANSWERS: {
                    let options = question.options.map((opt) => ({
                        description: Mustache.render(opt.description, symbols),
                        key: opt.key,
                    }));
                    if (question.shuffleOptions) {
                        options = _.shuffle(options);
                    }

                    result.subQuestions.push({
                        type: question.type,
                        description: Mustache.render(
                            question.description,
                            symbols
                        ),
                        options: options,
                        answerKeys: question.answerKeys,
                        explanation: Mustache.render(
                            question.explanation,
                            symbols
                        ),
                        isCorrect: false,
                    });
                    break;
                }
                case QuestionType.NUMBER: {
                    result.subQuestions.push({
                        type: question.type,
                        description: Mustache.render(
                            question.description,
                            symbols
                        ),
                        answerField: parseFloat(
                            Mustache.render(question.answerField, symbols)
                        ),
                        maximumError: question.maximumError,
                        explanation: Mustache.render(
                            question.explanation,
                            symbols
                        ),
                        isCorrect: false,
                    });
                    break;
                }
                case QuestionType.TEXT: {
                    result.subQuestions.push({
                        type: question.type,
                        description: Mustache.render(
                            question.description,
                            symbols
                        ),
                        answerField: Mustache.render(
                            question.answerField,
                            symbols
                        ),
                        matchCase: question.matchCase,
                        explanation: Mustache.render(
                            question.explanation,
                            symbols
                        ),
                        isCorrect: false,
                    });
                    break;
                }
                default: {
                    throw new Error(
                        `Unrecognized question option: ${question.type}`
                    );
                }
            }
        }

        return result;
    }

    /**
     * Checks if the saved answer of a question is correct, and updates
     * the question object accordingly
     */
    processQuestionAnswer(question: ConcreteQuestion) {
        for (const subQuestion of question.subQuestions) {
            switch (subQuestion.type) {
                case QuestionType.MULTIPLE_CHOICE_SINGLE_ANSWER: {
                    if (subQuestion.userAnswerKey !== undefined) {
                        subQuestion.isCorrect =
                            subQuestion.userAnswerKey === subQuestion.answerKey;
                    }
                    break;
                }
                case QuestionType.MULTIPLE_CHOICE_MULTIPLE_ANSWERS: {
                    if (subQuestion.userAnswerKeys !== undefined) {
                        subQuestion.isCorrect = _.isEqual(
                            subQuestion.userAnswerKeys.sort(),
                            subQuestion.answerKeys.sort()
                        );
                    }
                    break;
                }
                case QuestionType.NUMBER: {
                    if (subQuestion.userAnswerField !== undefined) {
                        subQuestion.isCorrect =
                            Math.abs(
                                (subQuestion.userAnswerField as number) -
                                    (subQuestion.answerField as number)
                            ) <= subQuestion.maximumError;
                    }
                    break;
                }
                case QuestionType.TEXT: {
                    if (subQuestion.userAnswerField !== undefined) {
                        subQuestion.isCorrect = subQuestion.matchCase
                            ? (subQuestion.userAnswerField as string) ===
                              (subQuestion.answerField as string)
                            : (
                                  subQuestion.userAnswerField as string
                              ).toLowerCase() ===
                              (subQuestion.answerField as string).toLowerCase();
                    }
                    break;
                }
                default: {
                    throw new Error(
                        `Unrecognized question type: ${subQuestion.type}`
                    );
                }
            }
        }
    }

    /**
     * Attaches the user's answers to the question object
     */
    attachUserAnswerToQuestion(question: ConcreteQuestion, answers: any[]) {
        for (const [index, subQuestion] of question.subQuestions.entries()) {
            const answer = answers[index];
            switch (subQuestion.type) {
                case QuestionType.MULTIPLE_CHOICE_SINGLE_ANSWER: {
                    if (answer.answerKey !== undefined) {
                        subQuestion.userAnswerKey = answer.answerKey as number;
                    }
                    break;
                }
                case QuestionType.MULTIPLE_CHOICE_MULTIPLE_ANSWERS: {
                    if (answer.answerKeys !== undefined) {
                        subQuestion.userAnswerKeys =
                            answer.answerKeys as number[];
                    }
                    break;
                }
                case QuestionType.NUMBER: {
                    if (answer.answerField !== undefined) {
                        subQuestion.userAnswerField =
                            answer.answerField as number;
                    }
                    break;
                }
                case QuestionType.TEXT: {
                    if (answer.answerField !== undefined) {
                        subQuestion.userAnswerField =
                            answer.answerField as string;
                    }
                    break;
                }
                default: {
                    throw new Error(
                        `Unrecognized question type: ${subQuestion.type}`
                    );
                }
            }
        }
    }

    async questionTemplatesExist(questions: Types.ObjectId[]) {
        const result = await Promise.all(
            questions.map((question) =>
                (async () => {
                    return (
                        (await QuestionTemplateModel.findOne({
                            _id: question,
                            deletedAt: { $exists: false },
                        })) != null
                    );
                })()
            )
        );
        return result.every((x) => x);
    }

    async markAsDeleted(
        id: Types.ObjectId,
        options: QueryOptions<QuestionTemplateDocument> = {}
    ) {
        return await QuestionTemplateModel.findOneAndUpdate(
            { _id: id },
            { deletedAt: Date.now() },
            { ...options, new: true }
        );
    }

    async getPaginated(
        query: FilterQuery<QuestionTemplateDocument>,
        paths: string[],
        pageSize: number,
        pageNumber: number
    ) {
        return await Promise.all([
            QuestionTemplateModel.count({
                ...query,
                deletedAt: { $exists: false },
            }),
            QuestionTemplateModel.find({
                ...query,
                deletedAt: { $exists: false },
            })
                .skip(pageSize * (pageNumber - 1))
                .limit(pageSize)
                .populate(paths),
        ]);
    }

    async getPopulated(
        query: FilterQuery<QuestionTemplateDocument>,
        paths: string[]
    ) {
        return await QuestionTemplateModel.find({
            ...query,
            deletedAt: { $exists: false },
        }).populate(paths);
    }

    async getById(id: Types.ObjectId) {
        return await QuestionTemplateModel.findOne({
            _id: id,
            deletedAt: { $exists: false },
        });
    }

    async getByIdPopulated(id: Types.ObjectId, paths: string[]) {
        return await QuestionTemplateModel.findOne({
            _id: id,
            deletedAt: { $exists: false },
        }).populate(paths);
    }

    async questionTemplateWithSubjectExists(subjectId: Types.ObjectId) {
        return (
            (await QuestionTemplateModel.findOne({
                subject: subjectId,
                deletedAt: { $exists: false },
            })) != null
        );
    }

    async questionTemplateWithChapterExists(chapterId: Types.ObjectId) {
        return (
            (await QuestionTemplateModel.findOne({
                chapter: chapterId,
                deletedAt: { $exists: false },
            })) != null
        );
    }
}
