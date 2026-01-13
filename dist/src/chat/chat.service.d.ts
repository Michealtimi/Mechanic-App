import { PrismaService } from 'prisma/prisma.service';
import { ChatRoom, ChatMessage } from '@prisma/client';
import { CreateChatRoomDto, GetChatMessagesDto } from './dto/chat.dto';
export declare class ChatService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getOrCreateRoom(params: CreateChatRoomDto): Promise<ChatRoom>;
    getChatRoomById(roomId: string): Promise<ChatRoom | null>;
    saveMessage(params: {
        roomId: string;
        senderId: string;
        message: string;
    }): Promise<ChatMessage>;
    getMessages(roomId: string, paginationParams: GetChatMessagesDto): Promise<ChatMessage[]>;
    getUserChatRooms(userId: string): Promise<ChatRoom[]>;
    private isLikelyLeakage;
    private maskLeakage;
}
