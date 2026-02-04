import { Injectable, Logger } from '@nestjs/common';

/**
 * Simple Metrics Service for tracking API usage and performance
 * Can be extended to integrate with Prometheus, DataDog, or other monitoring tools
 */
@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private metrics: Map<string, number> = new Map();

  /**
   * Increment a counter metric
   */
  increment(metricName: string, value: number = 1): void {
    const current = this.metrics.get(metricName) || 0;
    this.metrics.set(metricName, current + value);
    this.logger.debug(`Metric ${metricName} incremented to ${current + value}`);
  }

  /**
   * Observe a value (for histograms/gauges)
   */
  observe(metricName: string, value: number): void {
    this.metrics.set(metricName, value);
    this.logger.debug(`Metric ${metricName} observed: ${value}`);
  }

  /**
   * Get metric value
   */
  get(metricName: string): number {
    return this.metrics.get(metricName) || 0;
  }

  /**
   * Get all metrics
   */
  getAll(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics.clear();
  }
}
