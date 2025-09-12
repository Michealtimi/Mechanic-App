 Mechanic SaaS Platform

A service booking platform for mechanics and customers.
Customers can book mechanics, pay securely via escrow (Paystack/Flutterwave), and mechanics can manage services, certifications, and payouts.

Built with NestJS + Prisma + PostgreSQL and designed as a scalable SaaS solution.


---

🚀 Features

👨‍🔧 Mechanic Features

Profile setup (bio, skills, certifications, profile picture).

Service management (add, update, delete services).

View bookings (pending, confirmed, completed).

Wallet overview (earnings, pending payouts).


🚗 Customer Features

Browse mechanics (search by skill, service, location).

Book a mechanic (choose service & schedule time).

Pay securely via Paystack/Flutterwave.

Track booking status (Pending → Confirmed → Completed).


💳 Payment & Escrow

Secure payments via Paystack/Flutterwave.

Escrow system (funds held until service is completed).

Automatic payout to mechanics.

Platform commission taken per transaction.


📊 Admin Features (optional / premium)

Manage mechanics and customers.

Monitor bookings & payments.

Revenue reporting dashboard.



---

🏗️ Project Structure

mechanic-app/
│── src/
│   ├── auth/             # Authentication (JWT, Guards, Roles)
│   ├── mechanic/         # Mechanic profile & service management
│   ├── booking/          # Booking flow (create, update, track)
│   ├── payment/          # Payment & escrow integration
│   ├── common/           # Shared utilities, guards, interceptors
│   └── prisma/           # Prisma ORM (database models & migrations)
│
│── prisma/
│   └── schema.prisma     # Database schema
│
│── package.json
│── README.md
│── tsconfig.json


---

⚙️ Tech Stack

Backend: NestJS (modular & scalable framework).

Database: PostgreSQL + Prisma ORM.

Authentication: JWT (with Role-based Guards).

Payments: Paystack + Flutterwave (escrow-based).

API Docs: Swagger (auto-generated endpoints).



---

📌 Installation

1. Clone repo:



git clone https://github.com/your-username/mechanic-app.git
cd mechanic-app

2. Install dependencies:



npm install

3. Setup environment variables:
Create .env file:



DATABASE_URL="postgresql://user:password@localhost:5432/mechanicdb"
JWT_SECRET="your-secret-key"
PAYSTACK_SECRET_KEY="your-paystack-key"
FLUTTERWAVE_SECRET_KEY="your-flutterwave-key"

4. Run database migrations:



npx prisma migrate dev

5. Start the server:



npm run start:dev


---

📖 API Documentation

Once the app is running, open Swagger UI at:
👉 http://localhost:3000/api

You’ll see interactive docs for all endpoints (Auth, Mechanic, Booking, Payment).


---

✅ Roadmap

[x] Mechanic profile + services.

[x] Booking system.

[x] Payment & escrow integration.

[ ] Admin dashboard.

[ ] Notifications (SMS/Email).

[ ] Mobile app (React Native / Flutter).



---

🤝 Contribution

Want to improve the platform?

1. Fork the repo.


2. Create a feature branch.


3. Submit a PR.




---

📜 License

MIT License. Free to use and adapt.

