import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IPaymentGateway } from './interface/payment-gateway.interface';
import { SandboxGateway } from './strategy/sandbox.gateway';
import { PaystackGateway } from './strategy/paystack.gateway';
import { FlutterwaveGateway } from './strategy/flutterwave.gateway';
import { StripeGateway } from './strategy/stripe.gateway';
import { getDefaultCurrency } from 'src/config/platform.config';

export type GatewayName = 'SANDBOX' | 'PAYSTACK' | 'FLUTTERWAVE' | 'STRIPE';

export interface GatewayResolveOptions {
  gateway?: string;
  countryCode?: string;
  currency?: string;
}

@Injectable()
export class PaymentGatewayFactory {
  private readonly logger = new Logger(PaymentGatewayFactory.name);
  private readonly cache = new Map<GatewayName, IPaymentGateway>();
  private readonly countryMap: Record<string, GatewayName>;
  private readonly currencyMap: Record<string, GatewayName>;
  private readonly defaultGateway: GatewayName;

  constructor(private readonly config: ConfigService) {
    this.countryMap = this.parseMap(config.get<string>('PAYMENT_GATEWAY_BY_COUNTRY'));
    this.currencyMap = this.parseMap(config.get<string>('PAYMENT_GATEWAY_BY_CURRENCY'));
    this.defaultGateway = this.normalizeName(
      config.get<string>('PAYMENT_GATEWAY') || 'SANDBOX',
    );
    this.cache.set('SANDBOX', new SandboxGateway());
    this.logger.log(
      `Payment gateways: default=${this.defaultGateway}, countries=${Object.keys(this.countryMap).length}, currencies=${Object.keys(this.currencyMap).length}`,
    );
  }

  getDefault(): IPaymentGateway {
    return this.getGateway(this.defaultGateway);
  }

  resolve(options: GatewayResolveOptions = {}): IPaymentGateway {
    if (options.gateway) {
      return this.getGateway(this.normalizeName(options.gateway));
    }

    const country = options.countryCode?.toUpperCase();
    if (country && this.countryMap[country]) {
      return this.getGateway(this.countryMap[country]);
    }

    const currency = (options.currency || getDefaultCurrency(this.config)).toUpperCase();
    if (this.currencyMap[currency]) {
      return this.getGateway(this.currencyMap[currency]);
    }

    if (!options.gateway && !this.currencyMap[currency]) {
      if (currency === 'NGN') return this.getGateway('PAYSTACK');
      if (['USD', 'EUR', 'GBP', 'CAD', 'AUD'].includes(currency)) {
        return this.getGateway('STRIPE');
      }
    }

    return this.getDefault();
  }

  resolveName(options: GatewayResolveOptions = {}): GatewayName {
    const gw = this.resolve(options);
    for (const [name, instance] of this.cache.entries()) {
      if (instance === gw) return name;
    }
    return this.normalizeName(options.gateway || this.defaultGateway);
  }

  getGateway(name: GatewayName): IPaymentGateway {
    const cached = this.cache.get(name);
    if (cached) return cached;

    try {
      let gateway: IPaymentGateway;
      switch (name) {
        case 'PAYSTACK':
          gateway = new PaystackGateway();
          break;
        case 'FLUTTERWAVE':
          gateway = new FlutterwaveGateway();
          break;
        case 'STRIPE':
          gateway = new StripeGateway();
          break;
        case 'SANDBOX':
        default:
          gateway = new SandboxGateway();
          name = 'SANDBOX';
          break;
      }
      this.cache.set(name, gateway);
      return gateway;
    } catch (err: any) {
      this.logger.error(`Failed to load gateway ${name}: ${err.message}`);
      throw new InternalServerErrorException(`Payment gateway ${name} is not configured`);
    }
  }

  private normalizeName(raw: string): GatewayName {
    const upper = raw.toUpperCase() as GatewayName;
    if (['SANDBOX', 'PAYSTACK', 'FLUTTERWAVE', 'STRIPE'].includes(upper)) {
      return upper;
    }
    return 'SANDBOX';
  }

  private parseMap(json?: string): Record<string, GatewayName> {
    if (!json?.trim()) return {};
    try {
      const parsed = JSON.parse(json) as Record<string, string>;
      const out: Record<string, GatewayName> = {};
      for (const [k, v] of Object.entries(parsed)) {
        out[k.toUpperCase()] = this.normalizeName(v);
      }
      return out;
    } catch (err: any) {
      this.logger.error(`Invalid PAYMENT_GATEWAY_BY_* JSON: ${err.message}`);
      return {};
    }
  }
}
