// src/auth/interfaces/authenticated-socket.interface.ts
import { Socket } from 'socket.io';
import { User } from '@prisma/client'; // Assuming your Prisma User model type


export interface AuthenticatedSocket extends Socket {
  data: {
    user: User;
  };
}