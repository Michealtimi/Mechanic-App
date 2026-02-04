# Dispatch module

**Intent:** Invisible Foreman: create dispatch offers for a booking (nearest mechanics by geo), accept/reject by mechanic, timeout cron for second wave. Main entry: `DispatchController`, `DispatchService`; `DispatchTimeoutCron` runs every minute. Uses raw SQL (Prisma.sql) for geo ordering; depends on LocationModule, NotificationModule (real-time offers). List/filter endpoints are role-guarded.
