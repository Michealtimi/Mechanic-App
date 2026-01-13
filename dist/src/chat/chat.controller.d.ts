import { Request } from 'express';
import { ChatService } from './chat.service';
import { ChatRoom, ChatMessage } from '@prisma/client';
interface AuthenticatedRequest extends Request {
    user: {
        id: string;
    };
}
export declare class ChatController {
    private chatService;
    private readonly logger;
    constructor(chatService: ChatService);
    getUserChatRooms(req: AuthenticatedRequest): Promise<ChatRoom[]>;
    getMessages(roomId: string, req: AuthenticatedRequest): Promise<ChatMessage[]>;
}
export {};
