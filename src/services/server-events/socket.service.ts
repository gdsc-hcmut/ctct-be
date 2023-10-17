import { injectable } from "inversify";
import { logger } from "../../lib/logger";
import { Server } from "socket.io";
import { CustomSocket, SocketConnectionRegistry } from "./socket_connections";
import passport from "passport";
import { TokenDocument } from "../../models/token.model";
import { SocketEventType } from "./socket_event_types";

@injectable()
export class SocketService {
    socketServer: Server;

    constructor() {
        logger.info("[Socket] Initializing...");
    }

    onConnection(socket: CustomSocket) {
        logger.debug(
            `[Socket] ${SocketEventType.CONNECT}: ${socket.userId} has connected!`
        );
        SocketConnectionRegistry.instance().addConnection(socket);

        socket.on(SocketEventType.DISCONNECT, (reason: string) => {
            logger.debug(
                `[Socket] ${SocketEventType.DISCONNECT}: ${socket.userId} has disconnected!`
            );
            SocketConnectionRegistry.instance().removeConnection(
                socket,
                reason
            );
        });
    }

    async endQuizSession(userId: string, quizSessionId: string) {
        logger.debug(
            `[Socket] ${SocketEventType.END_QUIZ_SESSION}: Session ${quizSessionId} by user ${userId} has ended`
        );
        SocketConnectionRegistry.instance()
            .getConnectionsOfUser(userId)
            .forEach((connection) => {
                connection.socket.emit(SocketEventType.END_QUIZ_SESSION, {
                    userId,
                    quizSessionId,
                });
            });
    }

    async endExamSession(userId: string, examSessionId: string) {
        logger.debug(
            `[Socket] ${SocketEventType.END_EXAM_SESSION}: Session ${examSessionId} by user ${userId} has ended`
        );
        SocketConnectionRegistry.instance()
            .getConnectionsOfUser(userId)
            .forEach((connection) => {
                connection.socket.emit(SocketEventType.END_EXAM_SESSION, {
                    userId,
                    examSessionId,
                });
            });
    }

    initialize = (socketServer: Server) => {
        this.socketServer = socketServer;
        const wrapMiddlewareForSocketIo =
            (middleware: any) => (socket: any, next: any) =>
                middleware(socket.request, {}, next);
        this.socketServer.use(wrapMiddlewareForSocketIo(passport.initialize()));
        this.socketServer.use((socket: any, next: any) => {
            passport.authenticate(
                "jwt",
                (err, tokenMeta: TokenDocument, info, x, y) => {
                    if (err || !tokenMeta)
                        return next(new Error("Authentication error"));
                    socket.userId = tokenMeta.userId;
                    next();
                }
            )(socket.request, {}, next);
        });
        this.socketServer.on(SocketEventType.CONNECT, this.onConnection);
    };
}
