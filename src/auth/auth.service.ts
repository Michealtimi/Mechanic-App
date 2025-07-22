import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException } from '@nestjs/common';
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

   async signupCusmtomer(dto: AuthDto) {
        try {
        const { email, password } = dto;

        const foundUser = await this.prisma.user.findUnique({ where: { email } });  // Check if user already exists
        // If user already exists, throw an error
        if (foundUser) {
            throw new BadRequestException('Email Already Exists');
        }

        // Hash the password before saving it
        const hashedPassword = await this.hashPassword(password);
        const user = await this.prisma.user.create({
            data: {
            email,
            password: hashedPassword,
            role: Role.CUSTOMER,
            },
        });

        return {
            success: true,
            message: 'Sign up was successful',
            data: user,
        };
        } catch (error) {
        throw new InternalServerErrorException(
            error.message || 'Sign-up failed. Please try again later.'
        );
        }
    }

// Method to sign up a mechanic
 async signupMechanic(dto: AuthDto) {
        try {
        const { email, password } = dto;

        // confirm if user exists
        const foundUser = await this.prisma.user.findUnique({ where: { email } });
        if (foundUser) {
            throw new BadRequestException('Email Already Exists');
        }

            // Hash the password before saving it      
        const hashedPassword = await this.hashPassword(password);
        const user = await this.prisma.user.create({
            data: {
            email,
            password: hashedPassword,
            role: Role.MECHANIC,
            status: 'PENDNG',
            },
        });

        return {
            success: true,
            message: 'Sign up was successful',
            data: user,
        };
        } catch (error) {
        throw new InternalServerErrorException(
            error.message || 'Sign-up failed. Please try again later.'
        );
        }
    }

    // Method to sign in a user
    async signin(dto: AuthDto, req: Request, res: Response) {  /// request and response are used to handle the request and response objects
        try {
        const { email, password } = dto;

        // Check if user exists
        const foundUser = await this.prisma.user.findUnique({ where: { email } });
        if (!foundUser || !foundUser.password) {
            throw new BadRequestException('Wrong Credentials');
        }

        // Compare the provided password with the stored hashed password
        // If the password does not match, throw an error
        const isMatch = await this.comparePassword({
            password,
            hashedPassword: foundUser.password,
        });

        if (!isMatch) {
            throw new BadRequestException('Wrong Credentials');
        }

        // If the user is found and the password matches, generate a JWT token
        const token = await this.signToken({
            id: foundUser.id,
            email: foundUser.email,
            role: foundUser.role,
        });

        if (!token) {
            throw new ForbiddenException('Token generation failed');
        }

        res.cookie('token', token);
        return res.send({ message: 'Logged in Successfully' });
        } catch (error) {
        throw new InternalServerErrorException(
            error.message || 'Sign-in failed. Please try again later.'
        );
        }
    }
    
    // Method to sign out a user
    async signout(req: Request, res: Response) {
        try {
        res.clearCookie('token');
        return res.send({ message: 'Logged out successfully' });
        } catch (error) {
        throw new InternalServerErrorException(
            error.message || 'Sign-out failed. Please try again later.'
        );
        }
    }

    // Helper methods for password hashing and token generation
    async hashPassword(password: string) {
        try {
        const saltOrRounds = 10;
        return await bcrypt.hash(password, saltOrRounds);
        } catch (error) {
        throw new InternalServerErrorException('Password hashing failed');
        }
    }

    /// Method to compare passwords
    async comparePassword(args: { password: string; hashedPassword: string }) {
        try {
        return await bcrypt.compare(args.password, args.hashedPassword);
        } catch (error) {
        throw new InternalServerErrorException('Password comparison failed');
        }
    }

    
    async signToken(args: { id: string; email: string; role: Role }) {
    try {
      const payload = args;
      return this.jwt.signAsync(payload, { secret: jwtSecret });
    } catch (error) {
      throw new InternalServerErrorException('JWT generation failed');
    }
  }


   async role() {
    return;
  }
    }

    



