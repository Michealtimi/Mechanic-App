import { Body, Controller, Get, Post, Req, Res, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';


@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  
 
  @Post('signup')
  signup(@Body(ValidationPipe) dto: AuthDto  ){
    return this.authService.signupMechanic(dto);
  }

  @Post('signin')
  signin(@Body(ValidationPipe) dto: AuthDto, @Res() res, @Req() req){
    return this.authService.signin(dto, req, res);
  }

  @Get('signout')
  signout( @Res() res, @Req() req){
    return this.authService.signout(req, res);
  }




}

