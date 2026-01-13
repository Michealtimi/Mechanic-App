// src/auth/auth.controller.ts (After changes)

import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
// Make sure to import the updated RegisterUserDto from the correct path
import { RegisterUserDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';
import { ApiTags, ApiResponse, ApiOperation, ApiBody } from '@nestjs/swagger'; // Added ApiBody for better Swagger docs

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterUserDto, description: 'User registration data, including optional mechanic-specific fields if role is MECHANIC' }) // Added/updated ApiBody
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 400, description: 'Bad Request (e.g., email already in use, validation errors)' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async register(@Body() dto: RegisterUserDto) { // No change needed here if you used the same DTO name
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user and get JWT tokens' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized (Invalid credentials)' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Invalidate refresh token and log out user' })
  @ApiBody({ description: 'Refresh token to revoke', schema: { type: 'object', properties: { refreshToken: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request (e.g., refresh token not found)' })
  @ApiResponse({ status: 403, description: 'Forbidden (e.g., invalid/expired refresh token)' })
  // Note: Your service is designed to return "Logged out" even on some errors, which is good for security.
  async logout(@Body('refreshToken') refreshToken: string) {
    return this.authService.logout(refreshToken);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiBody({ description: 'Refresh token to get new access token', schema: { type: 'object', properties: { refreshToken: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'New access token issued' })
  @ApiResponse({ status: 403, description: 'Forbidden (e.g., invalid/expired/revoked refresh token)' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset link' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({ status: 200, description: 'If an account exists, a reset link was sent.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset user password using a valid token' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 400, description: 'Bad Request (e.g., user not found)' })
  @ApiResponse({ status: 403, description: 'Forbidden (e.g., invalid or expired reset token)' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}