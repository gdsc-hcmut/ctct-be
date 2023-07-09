import { injectable } from "inversify";
import { logger } from "../lib/logger";
import {
    FilterQuery,
    ProjectionType,
    QueryOptions,
    SaveOptions,
    Types,
} from "mongoose";
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

    async create(userId: Types.ObjectId, data: any, options: SaveOptions = {}) {
        /**
         * data should include metadata (as indicated by the model)
         * except createdBy and createdAt (automatically generated)
         */
        return (
            await QuestionTemplateModel.create(
                [
                    {
                        ...data,
                        createdAt: Date.now(),
                        createdBy: userId,
                    },
                ],
                options
            )
        )[0];
    }

    generateConcreteQuestion(
        questionTemplate: QuestionTemplateDocument,
        point: number[] = new Array<number>(
            questionTemplate.questions.length
        ).fill(0),
        triesLeft = 1
    ) {
        console.assert(questionTemplate.questions.length === point.length);
        const result: ConcreteQuestion = {
            questions: [],
            triesLeft: triesLeft,
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

        for (const [index, question] of questionTemplate.questions.entries()) {
            switch (question.questionType) {
                case QuestionType.MULTIPLE_CHOICE_SINGLE_ANSWER: {
                    result.questions.push({
                        questionType: question.questionType,
                        description: Mustache.render(
                            question.description,
                            symbols
                        ),
                        options: _.shuffle(
                            question.options.map((opt) => ({
                                description: Mustache.render(
                                    opt.description,
                                    symbols
                                ),
                                key: opt.key,
                            }))
                        ),
                        answerKey: question.answerKey,
                        explanation: Mustache.render(
                            question.explanation,
                            symbols
                        ),
                        isCorrect: false,
                        point: point[index],
                    });
                    break;
                }
                case QuestionType.MULTIPLE_CHOICE_MULTIPLE_ANSWERS: {
                    result.questions.push({
                        questionType: question.questionType,
                        description: Mustache.render(
                            question.description,
                            symbols
                        ),
                        options: _.shuffle(
                            question.options.map((opt) => ({
                                description: Mustache.render(
                                    opt.description,
                                    symbols
                                ),
                                key: opt.key,
                            }))
                        ),
                        answerKeys: question.answerKeys,
                        explanation: Mustache.render(
                            question.explanation,
                            symbols
                        ),
                        isCorrect: false,
                        point: point[index],
                    });
                    break;
                }
                case QuestionType.NUMBER: {
                    result.questions.push({
                        questionType: question.questionType,
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
                        point: point[index],
                    });
                    break;
                }
                case QuestionType.TEXT: {
                    result.questions.push({
                        questionType: question.questionType,
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
                        point: point[index],
                    });
                    break;
                }
                default: {
                    throw new Error(
                        `Unrecognized question option: ${question.questionType}`
                    );
                }
            }
        }

        return result;
    }

    processAnswer(concreteQuestion: ConcreteQuestion, answers: any[]) {
        console.assert(concreteQuestion.questions.length === answers.length);

        // a user cannot answer if they have no tries left for this question,
        // or they have already guessed every subquestion correctly
        if (concreteQuestion.triesLeft === 0) {
            throw new Error(`You have used all attempts for this question`);
        }
        if (concreteQuestion.questions.every((x) => x.isCorrect)) {
            throw new Error(
                `You have already answered this question correctly`
            );
        }

        const ans: boolean[] = concreteQuestion.questions.map((question, i) => {
            const answer = answers[i];

            switch (question.questionType) {
                case QuestionType.MULTIPLE_CHOICE_SINGLE_ANSWER: {
                    if (answer.answerKey === undefined) {
                        return false;
                    }
                    return (answer.answerKey as number) === question.answerKey;
                }
                case QuestionType.MULTIPLE_CHOICE_MULTIPLE_ANSWERS: {
                    if (answer.answerKeys === undefined) {
                        return false;
                    }
                    const a = (answer.answerKeys as number[]).sort();
                    const b = [...question.answerKeys].sort();
                    for (const [i, x] of a.entries()) {
                        if (x !== b[i]) {
                            return false;
                        }
                    }
                    return true;
                }
                case QuestionType.NUMBER: {
                    const answerField = answer.answerField as number;
                    if (answerField === undefined) {
                        throw new Error(`Answer missing 'answerField'`);
                    }
                    return (
                        Math.abs(
                            answerField - (question.answerField as number)
                        ) <= question.maximumError
                    );
                }
                case QuestionType.TEXT: {
                    const answerField = answer.answerField as string;
                    if (answerField === undefined) {
                        throw new Error(`Answer missing 'answerField'`);
                    }
                    return question.matchCase
                        ? (question.answerField as string).trim() ===
                              answerField.trim()
                        : (question.answerField as string).toLowerCase() ===
                              answerField.toLowerCase().trim();
                }
                default: {
                    throw new Error(
                        `Unrecognized question type. Received: ${question.questionType}`
                    );
                }
            }
        });
        return ans;
    }

    /**
     * Receives a concrete question and data for user's answer to that question
     * and copies the according user answer to dedicated fields of the question.
     * **Note: This method modifies the original object**
     */
    attachUserAnswerToQuestion(
        concreteQuestion: ConcreteQuestion,
        answers: any[]
    ) {
        console.assert(concreteQuestion.questions.length === answers.length);
        concreteQuestion.questions.forEach((question, i) => {
            const answer = answers[i];

            switch (question.questionType) {
                case QuestionType.MULTIPLE_CHOICE_SINGLE_ANSWER: {
                    const answerKey = answer.answerKey as number;
                    if (answerKey !== undefined) {
                        question.userAnswerKey = answerKey;
                    }
                    break;
                }
                case QuestionType.MULTIPLE_CHOICE_MULTIPLE_ANSWERS: {
                    const answerKeys = answer.answerKeys as number[];
                    if (answerKeys !== undefined) {
                        question.userAnswerKeys = answerKeys;
                    }
                    break;
                }
                case QuestionType.NUMBER: {
                    const answerField = answer.answerField as number;
                    if (answerField !== undefined) {
                        question.userAnswerField = answerField;
                    }
                    break;
                }
                case QuestionType.TEXT: {
                    const answerField = answer.answerField as string;
                    if (answerField !== undefined) {
                        question.userAnswerField = answerField;
                    }
                    break;
                }
                default: {
                    throw new Error(
                        `Unrecognized question type. Received: ${question.questionType}`
                    );
                }
            }
        });
    }

    async questionTemplatesExist(
        questions: Types.ObjectId[],
        options: QueryOptions<QuestionTemplateDocument> = {}
    ) {
        const result = await Promise.all(
            questions.map((question) =>
                (async () => {
                    return (
                        (await QuestionTemplateModel.findById(
                            question,
                            {},
                            options
                        )) != null
                    );
                })()
            )
        );
        return result.every((x) => x);
    }

    async findOne(
        query: FilterQuery<QuestionTemplateDocument>,
        projection: ProjectionType<QuestionTemplateDocument> = {},
        options: QueryOptions<QuestionTemplateDocument> = {}
    ) {
        return QuestionTemplateModel.findOne(query, projection, options);
    }

    async deleteOne(
        query: FilterQuery<QuestionTemplateDocument>,
        options: QueryOptions<QuestionTemplateDocument> = {}
    ) {
        return await QuestionTemplateModel.deleteOne(query, options);
    }

    async findOneAndDelete(
        query: FilterQuery<QuestionTemplateDocument>,
        options: QueryOptions<QuestionTemplateDocument> = {}
    ) {
        return await QuestionTemplateModel.findOneAndDelete(query, options);
    }

    async find(
        query: FilterQuery<QuestionTemplateDocument>,
        projection: ProjectionType<QuestionTemplateDocument> = {},
        options: QueryOptions<QuestionTemplateDocument> = {}
    ) {
        return await QuestionTemplateModel.find(query, projection, options);
    }

    async findById(
        id: Types.ObjectId,
        projection: ProjectionType<QuestionTemplateDocument> = {},
        options: QueryOptions<QuestionTemplateDocument> = {}
    ) {
        return await QuestionTemplateModel.findById(id, projection, options);
    }
}
