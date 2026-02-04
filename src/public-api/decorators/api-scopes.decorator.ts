import { SetMetadata } from '@nestjs/common';

export const API_SCOPES_KEY = 'scopes';
export const ApiScopes = (...scopes: string[]) => SetMetadata(API_SCOPES_KEY, scopes);
