/* eslint-disable prettier/prettier */
import { Injectable, Logger, InternalServerErrorException, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Role } from '@prisma/client';
import { UploadEvCertDto } from './ev.dto';

@Injectable()
export class EvCertService {
  private readonly logger = new Logger(EvCertService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 1. UPLOAD CERTIFICATION (Mechanic Action)
   * Allows a mechanic to submit a certificate URL for review.
   */
  async uploadCertification(dto: UploadEvCertDto, callerId: string) {
    const op = `UploadEvCert for mechanic ${dto.mechanicId}`;
    this.logger.log(`Starting ${op}`);

    try {
      // Authorization: Caller must be the mechanic identified in the DTO
      if (dto.mechanicId !== callerId) {
        throw new ForbiddenException('You can only add certifications for your own profile.');
      }

      // Validation: Ensure the target user exists and has the MECHANIC role
      const mech = await this.prisma.user.findUnique({ 
        where: { id: dto.mechanicId, role: Role.MECHANIC }
      });
      if (!mech) {
        throw new NotFoundException('Mechanic not found or invalid role.');
      }

      // Create the Certification Record
      const rec = await this.prisma.evCertification.create({
        data: {
          mechanicId: dto.mechanicId,
          certUrl: dto.certUrl,
          provider: dto.provider,
          verified: false, // Default: awaiting admin review
        },
      });

      this.logger.log(`[${op}] Certificate ID ${rec.id} uploaded successfully.`);
      return rec;
      
    } catch (err: any) {
      this.logger.error(`❌ ${op} failed: ${err.message}`, err.stack);
      if (err instanceof NotFoundException || err instanceof ForbiddenException || err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException('Failed to upload EV certification.');
    }
  }

  /**
   * 2. VERIFY CERTIFICATION (Admin Action)
   * Admin approves a certificate, atomically updating the certificate status and the mechanic's profile.
   */
  async verifyCertification(certId: string, verifierId: string) {
    const op = `VerifyEvCert ${certId} by ${verifierId}`;
    this.logger.log(`Starting ${op}`);

    try {
      const rec = await this.prisma.evCertification.findUnique({ where: { id: certId }});
      if (!rec) {
        throw new NotFoundException('Certification not found.');
      }
      if (rec.verified) {
        this.logger.warn(`[${op}] Certificate already verified.`);
        return rec; 
      }

      // Use Transaction for atomic update of Certification and User Profile
      const updatedCert = await this.prisma.$transaction(async (tx: TransactionClient) => {
        
        // A. Update the Certificate record
        const cert = await tx.evCertification.update({
          where: { id: certId },
          data: { 
            verified: true, 
            verifiedBy: verifierId, 
            verifiedAt: new Date() 
          },
        });

        // B. Check if the mechanic now has at least one verified certificate
        const verifiedCount = await tx.evCertification.count({ 
          where: { mechanicId: cert.mechanicId, verified: true } 
        });

        // C. Update the Mechanic's Profile (Sets the specialization flag)
        if (verifiedCount > 0) { 
          await tx.user.update({
            where: { id: cert.mechanicId, role: Role.MECHANIC },
            data: { 
              isEvSpecialist: true,
              lastCertificationVerifiedAt: new Date(), 
            }
          });
        }
        
        return cert;
      });

      this.logger.log(`[${op}] Successfully verified certificate and updated mechanic profile.`);
      return updatedCert;
      
    } catch (err: any) {
      this.logger.error(`❌ ${op} failed: ${err.message}`, err.stack);
      if (err instanceof NotFoundException) throw err;
      throw new InternalServerErrorException('Failed to verify EV certification.');
    }
  }

  /**
   * 3. LIST CERTIFICATIONS (Mechanic/Admin Action)
   * Retrieves all certification records for a specific mechanic.
   */
  async listForMechanic(mechanicId: string) {
    return this.prisma.evCertification.findMany({ 
      where: { mechanicId },
      orderBy: { createdAt: 'desc' }
    });
  }
}