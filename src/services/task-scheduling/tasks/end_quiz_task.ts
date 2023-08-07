import {
    QuizSessionDocument,
    QuizStatus,
} from "../../../models/quiz_session.model";
import { ScheduledTask } from "../scheduled_task";
import { Types } from "mongoose";
import { QuizSessionService } from "../../../services/quiz_session.service";
import { SocketService } from "../../../services/server-events/socket.service";
import { TaskSchedulingService } from "../task_scheduling.service";
import { QuestionService } from "../../../services/question.service";
import { logger } from "../../../lib/logger";

export class EndQuizTask implements ScheduledTask<QuizSessionDocument> {
    private userId: Types.ObjectId;
    private quizSessionId: Types.ObjectId;
    private quizSessionService: QuizSessionService;
    private socketService: SocketService;
    private taskSchedulingService: TaskSchedulingService;
    private questionService: QuestionService;

    constructor(
        userId: Types.ObjectId,
        quizSessionId: Types.ObjectId,
        quizSessionService: QuizSessionService,
        socketService: SocketService,
        taskSchedulingService: TaskSchedulingService,
        questionService: QuestionService
    ) {
        this.userId = userId;
        this.quizSessionId = quizSessionId;
        this.quizSessionService = quizSessionService;
        this.socketService = socketService;
        this.taskSchedulingService = taskSchedulingService;
        this.questionService = questionService;
    }

    async execute() {
        try {
            logger.info(
                `Ending quiz session ${this.quizSessionId.toString()} by ${this.userId.toString()}`
            );
            const quizEndTime = Date.now();
            const countCancelled = await this.taskSchedulingService.disable({
                "data.userId": this.userId,
                "data.quizSessionId": this.quizSessionId,
            });
            if (countCancelled === 0) {
                logger.debug(
                    `Didn't disable any end quiz task similar to quiz ${this.quizSessionId.toString()}`
                );
            } else {
                logger.debug(
                    `Disabled ${countCancelled} end quiz task similar to quiz ${this.quizSessionId.toString()}`
                );
            }

            const quizSession =
                await this.quizSessionService.getOngoingQuizSessionOfUser(
                    this.quizSessionId,
                    this.userId
                );

            if (!quizSession) {
                throw new Error(
                    `The requested quiz was not found, or may have already finished`
                );
            }

            quizSession.questions.forEach((question) => {
                this.questionService.processQuestionAnswer(question);
            });
            quizSession.status = QuizStatus.ENDED;
            quizSession.endedAt = quizEndTime;
            let cur = 0,
                tot = 0;
            quizSession.questions.forEach((question) => {
                tot++;
                if (question.isCorrect) {
                    cur++;
                }
            });
            quizSession.standardizedScore = tot === 0 ? 0 : (10 * cur) / tot;

            // let's use atomic operation instead of save(), because a
            // race condition might occur and prevent us from ending the quiz
            const result = await this.quizSessionService.findOneAndUpdate(
                { _id: this.quizSessionId },
                {
                    questions: quizSession.questions,
                    status: QuizStatus.ENDED,
                    endedAt: quizEndTime,
                    standardizedScore: quizSession.standardizedScore,
                },
                { new: true }
            );

            this.socketService.endQuizSession(
                this.userId.toString(),
                this.quizSessionId.toString()
            );

            return result;
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            throw error; // let whatever uses this handle the error
        }
    }
}
