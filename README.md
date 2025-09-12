
🚗 Mechanic Service Platform API

A backend API built with Node.js, NestJS, and PostgreSQL for managing mechanic services, customer requests, and payment integration.
This project demonstrates scalable backend architecture, authentication, and real-world business logic.


---

✨ Features

🔐 Authentication & Authorization using JWT + bcrypt

👨‍🔧 Mechanic Management: Add, update, and assign mechanics to service requests

📅 Service Requests: Customers can book and track mechanic services

💳 Payment Integration: Paystack integration (in progress) for secure transactions

📊 API Documentation with Swagger

🛠 Database: PostgreSQL + Prisma ORM



---

🛠 Tech Stack

Node.js + NestJS – Backend framework

PostgreSQL + Prisma ORM – Database & ORM

Swagger – API documentation

JWT + bcrypt – Security & authentication

Render – Deployment



---

🚀 Getting Started

1️⃣ Clone the repo

git clone https://github.com/Michealtimi/mechanic-api.git
cd mechanic-api

2️⃣ Install dependencies

npm install

3️⃣ Set up environment variables

Create a .env file in the root:

DATABASE_URL=postgresql://username:password@localhost:5432/mechanicdb
JWT_SECRET=your_secret_key
PAYSTACK_SECRET=your_paystack_secret

4️⃣ Run migrations

npx prisma migrate dev --name init

5️⃣ Start the server

npm run start:dev

Server runs at http://localhost:3000

Swagger docs: http://localhost:3000/api


---

📌 API Endpoints

Method	Endpoint	Description

POST	/auth/register	Register new user
POST	/auth/login	Login & get JWT
POST	/mechanics	Add mechanic (admin)
GET	/mechanics	List mechanics
POST	/requests	Create service request
GET	/requests/:id	Track service request



---

🏗 Future Improvements

✅ Add role-based access (Admin, Mechanic, Customer)

✅ Improve error handling

🚧 Integrate full Paystack payment workflow

🚧 Add email notifications



---

👨‍💻 Author

Agunbiade Micheal Timileyin

🌍 GitHub

📧 michealagunbiade1@gmail.com

