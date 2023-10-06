import { ScheduledTask } from "../scheduled_task";
import { Types } from "mongoose";
import { SocketService } from "../../../services/server-events/socket.service";
import { TaskSchedulingService } from "../task_scheduling.service";
import { QuestionService } from "../../../services/question.service";
import { logger } from "../../../lib/logger";
import { ExamSessionService } from "../../../services/exam_session.service";
import {
    ExamSessionDocument,
    ExamSessionStatus,
} from "../../../models/exam_session.model";

export class EndExamTask implements ScheduledTask<ExamSessionDocument> {
    private userId: Types.ObjectId;
    private examSessionId: Types.ObjectId;
    private examSessionService: ExamSessionService;
    private socketService: SocketService;
    private taskSchedulingService: TaskSchedulingService;
    private questionService: QuestionService;

    constructor(
        userId: Types.ObjectId,
        examSessionId: Types.ObjectId,
        examSessionService: ExamSessionService,
        socketService: SocketService,
        taskSchedulingService: TaskSchedulingService,
        questionService: QuestionService
    ) {
        this.userId = userId;
        this.examSessionId = examSessionId;
        this.examSessionService = examSessionService;
        this.socketService = socketService;
        this.taskSchedulingService = taskSchedulingService;
        this.questionService = questionService;
    }

    async execute() {
        try {
            logger.info(
                `Ending exam session ${this.examSessionId.toString()} by ${this.userId.toString()}`
            );
            const examEndTime = Date.now();
            const countCancelled = await this.taskSchedulingService.disable({
                "data.userId": this.userId,
                "data.examSessionId": this.examSessionId,
            });
            if (countCancelled === 0) {
                logger.debug(
                    `Didn't disable any end exam task similar to exam ${this.examSessionId.toString()}`
                );
            } else {
                logger.debug(
                    `Disabled ${countCancelled} end exam task similar to exam ${this.examSessionId.toString()}`
                );
            }

            const examSession =
                await this.examSessionService.getOngoingSessionOfUser(
                    this.userId,
                    this.examSessionId
                );

            if (!examSession) {
                throw new Error(
                    `The requested exam was not found, or may have already finished`
                );
            }

            examSession.questions.forEach((question) => {
                this.questionService.processQuestionAnswer(question);
            });
            examSession.status = ExamSessionStatus.ENDED;
            examSession.endedAt = examEndTime;
            let cur = 0,
                tot = 0;
            examSession.questions.forEach((question) => {
                tot++;
                if (question.isCorrect) {
                    cur++;
                }
            });
            examSession.standardizedScore = tot === 0 ? 0 : (10 * cur) / tot;

            // let's use atomic operation instead of save(), because a
            // race condition might occur and prevent us from ending the exam
            const result = await this.examSessionService.findOneAndUpdate(
                { _id: this.examSessionId },
                {
                    questions: examSession.questions,
                    status: ExamSessionStatus.ENDED,
                    endedAt: examEndTime,
                    standardizedScore: examSession.standardizedScore,
                },
                { new: true }
            );

            this.socketService.endExamSession(
                this.userId.toString(),
                this.examSessionId.toString()
            );

            return result;
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            throw error; // let whatever uses this handle the error
        }
    }
}
