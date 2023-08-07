import { logger } from "../../lib/logger";
import { Agenda, Job, JobAttributesData, JobOptions } from "agenda";
import { ScheduledTaskType } from "./schedule_task_type";
import { EndQuizTask } from "./tasks/end_quiz_task";
import { Types } from "mongoose";
import { inject, injectable } from "inversify";
import { ServiceType } from "../../types";
import { SocketService } from "../server-events/socket.service";
import { QuestionService } from "../question.service";
import { QuizSessionService } from "../quiz_session.service";
import { Filter, Document } from "mongodb";

@injectable()
export class TaskSchedulingService {
    private agenda: Agenda;

    constructor(
        @inject(ServiceType.QuizSession)
        private quizSessionService: QuizSessionService,
        @inject(ServiceType.Socket) private socketService: SocketService,
        @inject(ServiceType.Question) private questionService: QuestionService
    ) {
        this.initialize();
    }

    async initialize() {
        logger.info("[TaskScheduling] Initializing...");
        this.agenda = new Agenda({
            db: {
                address: process.env.DB_URI,
                collection: "scheduled_tasks",
            },
        });

        this.agenda.define(
            ScheduledTaskType.END_QUIZ_SESSION,
            this.endQuizSession.bind(this)
        );

        await this.agenda.start();
    }

    async schedule(
        when: Date | string,
        type: ScheduledTaskType,
        data: JobAttributesData = {}
    ) {
        return await this.agenda.schedule(when, type, data);
    }

    async every(
        interval: string,
        type: ScheduledTaskType,
        data: JobAttributesData = {},
        options: JobOptions = {}
    ) {
        return await this.agenda.every(interval, type, data, options);
    }

    async now(type: ScheduledTaskType, data: JobAttributesData = {}) {
        return await this.agenda.now(type, data);
    }

    async cancel(query: Filter<Document>) {
        return await this.agenda.cancel(query);
    }

    async disable(query: Filter<Document>) {
        return await this.agenda.disable(query);
    }

    async endQuizSession(job: Job) {
        try {
            const userId = job.attrs.data.userId as Types.ObjectId;
            const quizSessionId = job.attrs.data
                .quizSessionId as Types.ObjectId;
            if (!userId) {
                throw new Error(
                    `Trying to end quiz but missing ${userId.toString()}`
                );
            }
            if (!quizSessionId) {
                throw new Error(
                    `Trying to end quiz of user ${userId.toString()} but missing ${quizSessionId.toString()}`
                );
            }
            return await new EndQuizTask(
                userId,
                quizSessionId,
                this.quizSessionService,
                this.socketService,
                this,
                this.questionService
            ).execute();
        } catch (error) {
            logger.error(error.message);
            console.log(error);
        }
    }
}
