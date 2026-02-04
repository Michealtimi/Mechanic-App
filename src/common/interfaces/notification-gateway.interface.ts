/**
 * Interface for real-time notification emission used by booking flow.
 * Allows swapping implementation (e.g. NotificationGateway) for tests or other transports.
 */
export const NOTIFICATION_GATEWAY_TOKEN = Symbol('INotificationGateway');

export interface INotificationGateway {
  emitDispatchAssigned(mechanicId: string, payload: { bookingId: string; [key: string]: unknown }): Promise<void>;
  emitDispatchAccepted(bookingId: string, mechanicId: string, customerId: string): Promise<void>;
  emitMechanicArrived(bookingId: string, mechanicId: string): Promise<void>;
  emitBookingCompleted(bookingId: string, mechanicId: string, customerId: string): Promise<void>;
  emitBookingETALong(bookingId: string, durationSeconds: number): Promise<void>;
}
