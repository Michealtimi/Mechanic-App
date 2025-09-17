# 🔧 Mechanic Service Booking Platform (SaaS)

A modern SaaS platform that connects customers with verified mechanics.  
It enables booking, payments (with escrow), service management, and more.

---

## 🚀 Features

### ✅ Authentication & Authorization
- JWT-based authentication (Customer, Mechanic, Admin roles).
- Secure signup/login (email + password).
- Role-based access control.

### ✅ Mechanic Module
- Profile setup (bio, skills, certifications, profile picture).
- Manage services (add, update, delete).
- View earnings & past payouts.

### ✅ Customer Module
- Browse mechanics (search by skill/service/location).
- Book a service (choose mechanic & service, select time).
- Track booking status (Pending → Confirmed → Completed).

### ✅ Booking Module
- Create booking with validation.
- Mechanic can accept/reject.
- Customer can cancel before confirmation.
- Full booking lifecycle.

### ✅ Payment Module (WIP 🚧)
- Paystack & Flutterwave integration.
- Escrow system (funds held until service is completed).
- Automatic payout to mechanics.
- Commission logic for platform earnings.

### ✅ Admin Module (future)
- Manage users (customers & mechanics).
- Monitor bookings & payments.
- Generate revenue reports.

---

## 🛠️ Tech Stack

- **Backend**: [NestJS](https://nestjs.com/) (TypeScript)  
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM](https://www.prisma.io/)  
- **Authentication**: JWT + Role Guards  
- **Payment**: Paystack + Flutterwave  
- **Documentation**: Swagger UI  

---

## 📦 Installation

### Clone repo
```bash
git clone https://github.com/yourusername/mechanic-saas.git
cd mechanic-saas
Install dependencies
bash
Copy code
npm install
Setup environment variables
Create a .env file in the root:

env
Copy code
DATABASE_URL=postgresql://user:password@localhost:5432/mechanicdb
JWT_SECRET=yourjwtsecret
PAYSTACK_SECRET_KEY=your-paystack-secret
FLUTTERWAVE_SECRET_KEY=your-flutterwave-secret
Run migrations
bash
Copy code
npx prisma migrate dev
Start app
bash
Copy code
npm run start:dev
Swagger UI available at → http://localhost:3000/api

📌 Roadmap
 Authentication & roles

 Mechanic module

 Booking module

 Payment integration (escrow, wallet, payouts)

 Notifications (email, SMS, push)

 Ratings & reviews

 Admin dashboard

🤝 Contributing
Pull requests are welcome.
For major changes, please open an issue first to discuss what you would like to change.

📜 License
MIT License © 2025 Mechanic SaaS
