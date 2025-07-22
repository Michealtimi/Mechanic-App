import { Body, Controller, Get, Post, Req, Res, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  
 
  @Post('signup/customer')
  @ApiOperation({ summary: 'Sign up as a customer' })
  @ApiResponse({ status: 201, description: 'Customer created' })
  signupCustomer(@Body(ValidationPipe) dto: AuthDto, @Res() res, @Req() req) {
    return this.authService.signupCusmtomer(dto );
}

  @Post('signup/mechanic')
   @ApiOperation({ summary: 'Sign up as a mechanic' })
  @ApiResponse({ status: 201, description: 'mechanic created' })
  signupMechanic(@Body(ValidationPipe) dto: AuthDto, @Res() res, @Req() req){
    return this.authService.signupMechanic(dto);
  }

  @Get('signout')
    @ApiOperation({ summary: 'Sign out of the application' })
  @ApiResponse({ status: 200, description: 'Signed out successfully' })
  signout( @Res() res, @Req() req){
    return this.authService.signout(req, res);
  }

  @Post('signin')
  @ApiOperation({ summary: 'Signin to the application' })
  @ApiResponse({ status: 200, description: 'signedIn' })
  signin(@Body(ValidationPipe) dto: AuthDto, @Res() res, @Req() req) {
  return this.authService.signin(dto, req, res);
}




}

