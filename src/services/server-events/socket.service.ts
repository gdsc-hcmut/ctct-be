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
        logger.info("[Socket] Initializing socket service...");
    }

    onConnection(socket: CustomSocket) {
        SocketConnectionRegistry.instance().addConnection(socket);

        // bind some events

        // disconnect event
        SocketConnectionRegistry.instance().removeConnection(socket);
        this.socketServer.on(SocketEventType.DISCONNECT, (reason: string) => {
            SocketConnectionRegistry.instance().removeConnection(
                socket,
                reason
            );
        });
    }

    async endQuiz(userId: string, quizId: string) {
        logger.debug(`Quiz ${quizId} by ${userId} has ended`);
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
