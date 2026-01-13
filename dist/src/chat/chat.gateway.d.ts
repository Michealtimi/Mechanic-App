import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { ChatService } from './chat.service';
import { InitiateChatDto } from './dto/initiate-chat.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { AuthenticatedSocket } from '../auth/interfaces/authenticated-socket.interface';
export declare class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private chatService;
    server: Server;
    private readonly logger;
    constructor(chatService: ChatService);
    handleConnection(client: AuthenticatedSocket): Promise<void>;
    handleDisconnect(client: AuthenticatedSocket): Promise<void>;
    initiateChat(dto: InitiateChatDto, client: AuthenticatedSocket): Promise<{
        roomId: string;
        initialMessage: {
            id: string;
            createdAt: Date;
            message: string;
            roomId: string;
            senderId: string;
        };
    } | undefined>;
    sendMessage(dto: SendMessageDto, client: AuthenticatedSocket): Promise<{
        success: boolean;
        message: {
            id: string;
            createdAt: Date;
            message: string;
            roomId: string;
            senderId: string;
        };
    } | undefined>;
    joinRoom(roomId: string, client: AuthenticatedSocket): Promise<void>;
    getChatHistory(roomId: string, client: AuthenticatedSocket): Promise<{
        roomId: string;
        messages: {
            id: string;
            createdAt: Date;
            message: string;
            roomId: string;
            senderId: string;
        }[];
    } | undefined>;
}
