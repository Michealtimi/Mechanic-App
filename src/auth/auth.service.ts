import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
const bcrypt = require('bcryptjs');
import { PrismaService } from 'prisma/prisma.service';
import { AuthDto } from './dto/auth.dto';
import {JwtService } from '@nestjs/jwt';
import { jwtSecret } from '../utils/constant'
import { Request, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client'; // Import Role directly from @prisma/client



@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService, private jwt: JwtService ) {}

    async signupCusmtomer(dto: AuthDto){
        const { email, password } = dto;  //because we are expecting it, so it being created down/

        const foundUser = await this.prisma.user.findUnique({ where: { email } });
        if (foundUser){
            throw new BadRequestException("Email Already Exist")
        }

        const hashedPassword = await this.hashPassword(password); //hashing the password
        const user = await this.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                role: Role.MECHANIC,  // Assigning a default role},
        }});
        return {
            success: true,
            messalge: 'sign up was succesful',  
            data: user,
        };
    }

     async signupMechanic(dto: AuthDto){
        const { email, password } = dto;  //because we are expecting it, so it being created down/

        const foundUser = await this.prisma.user.findUnique({ where: { email } });
        if (foundUser){
            throw new BadRequestException("Email Already Exist")
        }

        const hashedPassword = await this.hashPassword(password); //hashing the password
        const user = await this.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                role: Role.CUSTOMER,  // Assigning a default role},
        }});
        return {
            success: true,
            messalge: 'sign up was succesful',  
            data: user,
        };
    }

    async signin(dto: AuthDto, req: Request, res: Response){
        const { email, password } = dto;

         const foundUser = await this.prisma.user.findUnique({ where: { email } }); /// speak to prisma
        if (!foundUser){
            throw new BadRequestException("Wrong Credentials")  ///if email is not found
        }

        if (!foundUser.password) {
            throw new BadRequestException("Wrong Credentials"); ///  if password is not found
        }
        const isMatch = await this.comparePassword({password, hashedPassword: foundUser.password});
        if (!isMatch){
            throw new BadRequestException("Wrong Credentials")  // comlaint if password is not correct
        }

        if (!foundUser.email) {
            throw new BadRequestException("User email is missing");  // if email is not found
        }
        const token = await this.signToken({   /// signing the token
            id: foundUser.id,                       
            email: foundUser.email
        });

        if (!token) {
            throw new ForbiddenException("Token generation failed");  // if token is not found  
        }

        res.cookie('token', token);

        return res.send({message: 'Logged in Succefully'});
    }
    
    async signout( req: Request, res: Response){
        res.clearCookie('token');  //clearing the cookie
        return res.send({message: 'Logged out successfully'});  //sending the response ;
    }


    async hashPassword(password:string){      /// br
        const saltOrRounds = 10;
        return await bcrypt.hash(password, saltOrRounds);
        
     
    }

    async comparePassword(args:{password: string, hashedPassword: string}) {
        return await bcrypt.compare(args.password, args.hashedPassword);
    } 

    async signToken(args: {id: string, email: string}) {
        const payload = args
          

        return this.jwt.signAsync(payload, {secret: jwtSecret})
    }

    async role(){
        return
    }

    
}


