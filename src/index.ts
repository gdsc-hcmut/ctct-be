import "reflect-metadata";

import { App } from "./app";
import container from "./container";
import { applyHttpResponseComposer } from "./lib/response-composer";

import { AuthService, UserService } from "./services";
import { AuthController, UserController } from "./controllers";
import { MeController } from "./controllers/me.controller";
import { ServiceType } from "./types";
import mongoose from "mongoose";

import dotenv from "dotenv";
import { toNumber } from "lodash";
dotenv.config();

console.log(`Connecting to DB: ${process.env.DB_URI}`);
mongoose.connect(process.env.DB_URI);
mongoose.connection.once("connected", () => {
    console.log("Connected to DB!");
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

// Initialize service first
Promise.all([
    // container.get<DatabaseService>(ServiceType.Database).initialize(),
]).then(() => {
    const app = new App(
        [
            container.resolve<AuthController>(AuthController),
            container.resolve<UserController>(UserController),
            container.resolve<MeController>(MeController),
        ],
        toNumber(process.env.PORT),
        [
            applyHttpResponseComposer,
            container.get<AuthService>(ServiceType.Auth).applyMiddleware(),
        ]
    );

    app.listen();
    // container.get<SocketService>(ServiceType.Socket).initialize(app.io);
});
