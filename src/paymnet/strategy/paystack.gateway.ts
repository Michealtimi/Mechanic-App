// src/modules/payment/strategies/paystack.gateway.ts

import axios, { AxiosError } from 'axios';
import { 
    Injectable, 
    Logger, 
    InternalServerErrorException, 
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { IPaymentGateway } from '../interface/payment-gateway.interface';

@Injectable()
export class PaystackGateway implements IPaymentGateway {
    private readonly logger = new Logger(PaystackGateway.name);
    private readonly baseUrl = 'https://api.paystack.co';
    private readonly secret = process.env.PAYSTACK_SECRET_KEY;

    constructor() {
        this.secret = process.env.PAYSTACK_SECRET_KEY;
        // CRITICAL: Check for configuration failure immediately on instantiation
        if (!this.secret) {
            this.logger.error('PAYSTACK_SECRET_KEY is not defined. Gateway cannot function.');
            throw new InternalServerErrorException('Payment gateway configuration is missing.');
        }
    }

    // --- Helper to handle common Axios errors and translate them ---
    private handlePaystackError(operation: string, error: unknown) {
        if (axios.isAxiosError(error)) {
            const status = (error.response?.status) ?? 500;
            const message = error.response?.data?.message || error.message;

            this.logger.error(`❌ ${operation} failed (HTTP ${status}): ${message}`, error.stack);
            
            // Translate common client errors from Paystack's API
            if (status === 400) {
                // e.g., Invalid amount, email, or missing parameter
                throw new BadRequestException(`Paystack error: ${message}`);
            }
            if (status === 404) {
                // e.g., Trying to verify a non-existent transaction
                throw new NotFoundException(`Paystack error: ${message}`);
            }
            if (status === 401 || status === 403) {
                 // Configuration/Authorization error
                throw new InternalServerErrorException('Paystack configuration error. Check API key.');
            }
            // Catch-all for unhandled server errors (5xx) or network issues
            throw new InternalServerErrorException(`Paystack service unavailable: ${message}`);
        }
        // Handle non-Axios/unknown errors
        this.logger.error(`❌ Unknown error during ${operation}: ${error}`, error);
        throw new InternalServerErrorException(`An unexpected error occurred during ${operation}.`);
    }

    // ----------------------------------------------------------------------
    // 1. INITIALIZE PAYMENT
    // ----------------------------------------------------------------------
    async initializePayment({ amount, email, metadata }) {
        const operation = 'Initialize Payment';
        try {
            this.logger.log(`🚀 ${operation} for ${email}`);
            
            // NOTE: Paystack expects amount in Kobo/Cents (smallest currency unit)
            const res = await axios.post(
                `${this.baseUrl}/transaction/initialize`,
                { amount, email, metadata },
                { headers: { Authorization: `Bearer ${this.secret}` } },
            );

            if (!res.data.status || !res.data.data) {
                throw new InternalServerErrorException('Paystack initialization response invalid.');
            }

            return {
                paymentUrl: res.data.data.authorization_url,
                reference: res.data.data.reference,
            };
        } catch (err) {
            this.handlePaystackError(operation, err);
        }
    }

    // ----------------------------------------------------------------------
    // 2. VERIFY PAYMENT
    // ----------------------------------------------------------------------
    async verifyPayment(reference: string) {
        const operation = `Verify Payment Reference ${reference}`;
        try {
            this.logger.log(`🔍 ${operation}`);
            
            const res = await axios.get(`${this.baseUrl}/transaction/verify/${reference}`, {
                headers: { Authorization: `Bearer ${this.secret}` },
            });
            
            const data = res.data.data;
            
            // Map Paystack status to your internal interface status
            let status: 'success' | 'failed' | 'pending';
            if (data.status === 'success') {
                status = 'success';
            } else if (data.status === 'failed' || data.status === 'abandoned') {
                status = 'failed';
            } else {
                status = 'pending';
            }
            
            return {
                status: status,
                amount: data.amount, // Amount in Kobo/Cents
                raw: data, // Full Paystack data for logging/auditing
            };
        } catch (err) {
            this.handlePaystackError(operation, err);
        }
    }

    // ----------------------------------------------------------------------
    // 3. CREATE SUBACCOUNT
    // ----------------------------------------------------------------------
    async createSubaccount({ businessName, bankCode, accountNumber, percentageCharge }) {
        const operation = `Create Subaccount for ${businessName}`;
        try {
            this.logger.log(`🏦 ${operation}`);
            
            // NOTE: `percentage_charge` should be passed as a float (e.g., 0.1 for 10%)
            const res = await axios.post(
                `${this.baseUrl}/subaccount`,
                {
                    business_name: businessName,
                    settlement_bank: bankCode, // Bank code is required
                    account_number: accountNumber,
                    percentage_charge: percentageCharge,
                    primary_contact_email: 'noreply@yourbusiness.com' // Paystack often requires a contact email
                },
                { headers: { Authorization: `Bearer ${this.secret}` } },
            );
            
            if (!res.data.status || !res.data.data) {
                throw new InternalServerErrorException('Paystack subaccount creation response invalid.');
            }

            return { subaccountId: res.data.data.subaccount_code };
        } catch (err) {
            this.handlePaystackError(operation, err);
        }
    }
}