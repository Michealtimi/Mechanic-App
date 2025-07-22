import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  BadRequestException,
  HttpCode,
  HttpStatus,
  Param,
  Delete,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

import { MechanicService } from './mechanic.service';
import { RolesGuard } from 'src/common/guard/roles.guards';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { CreatemechanicService } from './dto/create-mechanic-service.dto';
import { Express } from 'express';
import { Role } from '@prisma/client';
import { Roles } from 'src/common/decorators/roles.decorators';
import { UpdateMechanicDto } from './dto/update.mechanic.dto';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('Mechanic')  // this is used to group the endpoints in Swagger UI
@ApiBearerAuth()  // this indicates that the endpoints require a JWT token for access
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('mechanic')
export class MechanicController {
  constructor(private readonly mechanicService: MechanicService) {}

@ApiOperation({ summary: 'Get Mechanic Profile' })
@ApiResponse({ status: 200, description: 'Returns the mechanic profile' })
@Get('profile')
  async getMechanicProfile(@Request() req: Request & { user: { id: string } }) {
    const userId = req.user.id;
    return this.mechanicService.getMechanicProfile(userId);
  }    //// we have succefully fixed the put endpoint.

@ApiOperation({ summary: 'Update Mechanic Profile' })
@ApiResponse({ status: 200, description: 'Profile updated' })
@Put('profile')
  async updateMechanicProfile(
    @Request() req: Request & { user: { id: string } },
    @Body() dto: UpdateMechanicDto
  ) {
    const userId = req.user.id;
    return this.mechanicService.updateMechanicProfile(dto, userId);
  } 

  @ApiOperation({ summary: 'Upload mechanic certification file' })
@ApiConsumes('multipart/form-data')/// this tells swagger your endpoint is epecting a file upload
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      file: {
        type: 'string',
        format: 'binary',
      },
    },
  },
})
@Post('upload-certification')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/certifications',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async uploadCertification(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    const userId = req.user.id;
    return this.mechanicService.saveCertification(userId, file.filename);
  }

  @ApiOperation({ summary: 'Upload profile picture' })
@ApiConsumes('multipart/form-data')
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      profilePicture: {
        type: 'string',
        format: 'binary',
      },
    },
  },
})
@Post('profile/upload-picture')
  @UseInterceptors(
    FileInterceptor('profilePicture', {
      limits: {
        fileSize: 2 * 1024 * 1024,
      },
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          return callback(
            new BadRequestException('Only image files are allowed!'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async uploadProfilePicture(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    const userId = req.user.id;
    return this.mechanicService.uploadProfilePicture(userId, file);
  }

@ApiOperation({ summary: 'Create mechanic service' })  // groups endpoint in swagger ui
@ApiResponse({ status: 201, description: 'Service created successfully' })  // gives a response to the client
@ApiResponse({ status: 400, description: 'Bad Request' })  // handles bad request
@Post('service')
  @Roles(Role.MECHANIC)
  @HttpCode(HttpStatus.CREATED)
  async createMechanicService(
    @Request() req,
    @Body() dto: CreatemechanicService,
  ) {
    const userId = req.user.id;
    return this.mechanicService.createService(dto, userId);
  }

@ApiOperation({ summary: 'Get all mechanic services' })
@ApiResponse({ status: 200, description: 'List of services' })
@Get('service')
  async getAllMechanicServices(@Request() req) {
    const userId = req.user.id;
    return this.mechanicService.getallMechanicservice(userId);
  }

  @ApiOperation({ summary: 'Update a mechanic service' })
@ApiResponse({ status: 200, description: 'Service updated' })
@Put('service/:id')
  async updateService(
    @Request() req,
    @Body() dto: CreatemechanicService,
    @Param('id') serviceId: string,
  ) {
    const mechanicId = req.user.id;
    return this.mechanicService.UpdateMechanicService(dto, serviceId, mechanicId);
  }

  @ApiOperation({ summary: 'Delete a mechanic service' })
@ApiResponse({ status: 200, description: 'Service deleted' })
@Delete('service/:id')

  async deleteService(
    @Request() req,
    @Param('id') serviceId: string,
  ) {
    const mechanicId = req.user.id;
    return this.mechanicService.DeleteMechanicService(serviceId, mechanicId);
  }
}
