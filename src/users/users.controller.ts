import { Controller, Get, Param, Req, UseGuards, SetMetadata } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { Request } from 'express';
import { Role } from '@prisma/client';
import { RolesGuard } from 'src/common/guard/roles.guards';
import { Roles } from 'src/common/decorators/roles.decorators';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getMyUser(@Param('id') id: string, @Req() req: Request) {
    return this.usersService.getMyUser(id, req);
  }


 @UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Get('admin-only')
getAdminData() {
  return { message: 'Only admins can see this' };
}

    getUsers() {
    return this.usersService.getUsers();
  }
}