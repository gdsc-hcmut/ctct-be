import { Socket } from "socket.io";
import { logger } from "../../lib/logger";

export interface CustomSocket extends Socket {
    userId: string;
}

export type SocketInfo = {
    socket: CustomSocket;
};

export class SocketConnectionRegistry {
    private static _instance: SocketConnectionRegistry;
    private connections: {
        [userId: string]: SocketInfo[];
    };

    private constructor() {
        this.connections = {};
    }

    public static instance() {
        if (!SocketConnectionRegistry._instance) {
            SocketConnectionRegistry._instance = new SocketConnectionRegistry();
        }
        return SocketConnectionRegistry._instance;
    }

    addConnection(socket: CustomSocket) {
        logger.info(`Adding socket connection for user ${socket.userId}`);
        const info: SocketInfo = {
            socket: socket,
        };
        if (!this.connections[socket.userId]) {
            this.connections[socket.userId] = [info];
        } else {
            this.connections[socket.userId].push(info);
        }
    }

    removeConnection(socket: CustomSocket, reason = "none") {
        logger.info(
            `Removing socket connection for user ${socket.userId}, reason: ${reason}`
        );
        if (!this.connections[socket.userId]) {
            return false;
        } else {
            const ans =
                this.connections[socket.userId].find(
                    (x) => x.socket.id === socket.id
                ) != undefined;
            this.connections[socket.userId] = this.connections[
                socket.userId
            ].filter((x) => x.socket.id !== socket.id);
            return ans;
        }
    }

    getConnectionsOfUser(userId: string) {
        if (!this.connections[userId]) {
            return [];
        }
        return this.connections[userId];
    }
}
