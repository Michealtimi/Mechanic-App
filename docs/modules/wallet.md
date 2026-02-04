# Wallet module

**Intent:** User and mechanic wallet balances, credits, debits, and transaction history. Main entry: `WalletController`, `WalletService`. Endpoints are JWT-protected; `POST /wallet/credit/:mechanicId` is restricted to ADMIN/SUPERADMIN only. Depends on: AuditModule (for ledger). All monetary operations use Decimal and optional transaction client for consistency.
