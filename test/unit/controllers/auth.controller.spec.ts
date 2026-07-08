import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from 'src/auth/auth.controller';
import { AuthService } from 'src/auth/auth.service';
import {
  RegisterUserDto,
  LoginDto,
  QuickRegisterDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from 'src/auth/dto/auth.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            quickRegister: jest.fn(),
            login: jest.fn(),
            logout: jest.fn(),
            refreshToken: jest.fn(),
            forgotPassword: jest.fn(),
            resetPassword: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('register should delegate to AuthService.register', async () => {
    const dto: RegisterUserDto = {
      email: 'user@example.com',
      password: 'Password123!',
      firstName: 'John',
      lastName: 'Doe',
      role: 'CUSTOMER',
    } as any;

    const result = { id: 'user-id' };
    authService.register.mockResolvedValue(result as any);

    await expect(controller.register(dto)).resolves.toEqual(result);
    expect(authService.register).toHaveBeenCalledWith(dto);
  });

  it('quickRegister should delegate to AuthService.quickRegister', async () => {
    const dto: QuickRegisterDto = {
      email: 'quick@example.com',
      fullName: 'Quick User',
    } as any;
    const result = { user: { id: 'user-id' }, tokens: {} };
    authService.quickRegister.mockResolvedValue(result as any);

    await expect(controller.quickRegister(dto)).resolves.toEqual(result);
    expect(authService.quickRegister).toHaveBeenCalledWith(dto);
  });

  it('login should delegate to AuthService.login', async () => {
    const dto: LoginDto = { email: 'user@example.com', password: 'Password123!' } as any;
    const result = { accessToken: 'token' };
    authService.login.mockResolvedValue(result as any);

    await expect(controller.login(dto)).resolves.toEqual(result);
    expect(authService.login).toHaveBeenCalledWith(dto);
  });

  it('logout should delegate to AuthService.logout', async () => {
    const refreshToken = 'refresh-token';
    const result = { message: 'Logged out' };
    authService.logout.mockResolvedValue(result as any);

    await expect(controller.logout(refreshToken)).resolves.toEqual(result);
    expect(authService.logout).toHaveBeenCalledWith(refreshToken);
  });

  it('refresh should delegate to AuthService.refreshToken', async () => {
    const refreshToken = 'refresh-token';
    const result = { accessToken: 'new-token' };
    authService.refreshToken.mockResolvedValue(result as any);

    await expect(controller.refresh(refreshToken)).resolves.toEqual(result);
    expect(authService.refreshToken).toHaveBeenCalledWith(refreshToken);
  });

  it('forgotPassword should delegate to AuthService.forgotPassword', async () => {
    const dto: ForgotPasswordDto = { email: 'user@example.com' } as any;
    const result = { message: 'If an account exists, a reset link was sent.' };
    authService.forgotPassword.mockResolvedValue(result as any);

    await expect(controller.forgotPassword(dto)).resolves.toEqual(result);
    expect(authService.forgotPassword).toHaveBeenCalledWith(dto);
  });

  it('resetPassword should delegate to AuthService.resetPassword', async () => {
    const dto: ResetPasswordDto = {
      token: 'reset-token',
      newPassword: 'NewPassword123!',
    } as any;
    const result = { message: 'Password reset successful' };
    authService.resetPassword.mockResolvedValue(result as any);

    await expect(controller.resetPassword(dto)).resolves.toEqual(result);
    expect(authService.resetPassword).toHaveBeenCalledWith(dto);
  });
}

