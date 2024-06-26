import "reflect-metadata";

import { App } from "./app";
import container from "./container";
import { applyHttpResponseComposer } from "./lib/response-composer";

import {
    AuthService,
    UserService,
    CacheService,
    FileUploadService,
    MaterialService,
    PreviousExamService,
    SubjectService,
    AccessLevelService,
    QuizService,
    MapperService,
    TaskSchedulingService,
    SocketService,
    ChapterService,
    QuestionService,
    QuizSessionService,
    UserActivityService,
    ExamService,
    ExamSessionService,
    EventService,
    NewsService,
} from "./services/index";

import {
    AuthController,
    MaterialController,
    MeController,
    PreviousExamController,
    SubjectController,
    UserController,
    QuizController,
    ChapterController,
    QuestionController,
    QuizSessionController,
    AdminController,
    AccessLevelController,
    ExamController,
    ExamSessionController,
    EventController,
    NewsController,
} from "./controllers/index";

import { ServiceType } from "./types";
import mongoose from "mongoose";

import dotenv from "dotenv";
import { toNumber } from "lodash";
import { logger } from "./lib/logger";
dotenv.config();

logger.info(`Connecting to database at URI: ${process.env.DB_URI}`);
mongoose.connect(process.env.DB_URI);
mongoose.connection.once("connected", () => {
    logger.info("Database connection established");
});

// Binding service
container
    .bind<AuthService>(ServiceType.Auth)
    .to(AuthService)
    .inSingletonScope();
container
    .bind<UserService>(ServiceType.User)
    .to(UserService)
    .inSingletonScope();
container
    .bind<FileUploadService>(ServiceType.FileUpload)
    .to(FileUploadService)
    .inSingletonScope();
container
    .bind<PreviousExamService>(ServiceType.PreviousExam)
    .to(PreviousExamService)
    .inSingletonScope();
container
    .bind<SubjectService>(ServiceType.Subject)
    .to(SubjectService)
    .inSingletonScope();
container
    .bind<ChapterService>(ServiceType.Chapter)
    .to(ChapterService)
    .inSingletonScope();
container
    .bind<MaterialService>(ServiceType.Material)
    .to(MaterialService)
    .inSingletonScope();
container
    .bind<CacheService>(ServiceType.Cache)
    .to(CacheService)
    .inSingletonScope();
container
    .bind<AccessLevelService>(ServiceType.AccessLevel)
    .to(AccessLevelService)
    .inSingletonScope();
container
    .bind<QuestionService>(ServiceType.Question)
    .to(QuestionService)
    .inSingletonScope();
container
    .bind<QuizService>(ServiceType.Quiz)
    .to(QuizService)
    .inSingletonScope();
container
    .bind<QuizSessionService>(ServiceType.QuizSession)
    .to(QuizSessionService)
    .inSingletonScope();
container
    .bind<MapperService>(ServiceType.Mapper)
    .to(MapperService)
    .inSingletonScope();
container
    .bind<TaskSchedulingService>(ServiceType.TaskScheduling)
    .to(TaskSchedulingService)
    .inSingletonScope();
container
    .bind<SocketService>(ServiceType.Socket)
    .to(SocketService)
    .inSingletonScope();
container
    .bind<UserActivityService>(ServiceType.UserActivity)
    .to(UserActivityService)
    .inSingletonScope();
container
    .bind<ExamService>(ServiceType.Exam)
    .to(ExamService)
    .inSingletonScope();
container
    .bind<ExamSessionService>(ServiceType.ExamSession)
    .to(ExamSessionService)
    .inSingletonScope();
container
    .bind<EventService>(ServiceType.Event)
    .to(EventService)
    .inSingletonScope();
container
    .bind<NewsService>(ServiceType.News)
    .to(NewsService)
    .inSingletonScope();

// Initialize service first
Promise.all([
    // container.get<DatabaseService>(ServiceType.Database).initialize(),
]).then(() => {
    const app = new App(
        [
            container.resolve<AccessLevelController>(AccessLevelController),
            container.resolve<AuthController>(AuthController),
            container.resolve<UserController>(UserController),
            container.resolve<MeController>(MeController),
            container.resolve<PreviousExamController>(PreviousExamController),
            container.resolve<SubjectController>(SubjectController),
            container.resolve<ChapterController>(ChapterController),
            container.resolve<MaterialController>(MaterialController),
            container.resolve<QuestionController>(QuestionController),
            container.resolve<QuizController>(QuizController),
            container.resolve<QuizSessionController>(QuizSessionController),
            container.resolve<ExamController>(ExamController),
            container.resolve<ExamSessionController>(ExamSessionController),
            container.resolve<EventController>(EventController),
            container.resolve<AdminController>(AdminController),
            container.resolve<NewsController>(NewsController),
        ],
        toNumber(process.env.PORT),
        [
            applyHttpResponseComposer,
            container.get<AuthService>(ServiceType.Auth).applyMiddleware(),
        ]
    );

    app.listen();
    container.get<SocketService>(ServiceType.Socket).initialize(app.io);

    if (process.send) {
        process.send("ready");
    }
});
