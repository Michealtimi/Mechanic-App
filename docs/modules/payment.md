# Payment module

**Intent:** Handles payment initiation, gateway (Paystack/Flutterwave/Sandbox), webhooks, verification, and post-payment actions (wallet credit, booking completion). Main entry: `PaymentsController`, `PaymentsService`; gateway strategy is injectable. Depends on: WalletModule, BookingModule (for completion). Payment events are recorded via `PaymentEventService`; failures are logged and do not block the main flow.
