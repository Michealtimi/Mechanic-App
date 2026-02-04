# Booking module

**Intent:** Owns the full booking lifecycle: create, list, get, cancel, dispatch offers, mechanic arrival, completion PIN, receipt. Main entry: `BookingController` (HTTP) and `BookingService` (business logic). Depends on: PaymentModule, WalletModule, NotificationModule (real-time), SlaModule, LocationModule (geo), ReceiptModule, RevenueSharingModule, AppEcosystemModule (webhooks). BookingService injects `INotificationGateway` and `IMapsService` (see `src/common/interfaces/`) so notification and maps can be swapped for tests.
