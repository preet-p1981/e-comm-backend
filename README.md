# E-Commerce Backend

Production-ready Node.js + Express backend for the full-stack e-commerce application.

## Highlights

- JWT access and refresh token authentication
- Prisma ORM with PostgreSQL
- PhonePe checkout integration with payment status verification
- Cloudinary product image uploads
- Role-based admin APIs
- Swagger docs at `/api-docs`
- Helmet, CORS, rate limiting, centralized error handling, Morgan + Winston logging

## Setup

1. Copy `.env.example` to `.env` and fill in PostgreSQL, Cloudinary, and PhonePe credentials.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Generate Prisma client:
   ```bash
   npm run prisma:generate
   ```
4. Run migrations:
   ```bash
   npm run prisma:migrate
   ```
5. Seed admin and sample products:
   ```bash
   npm run prisma:seed
   ```
6. Start development server:
   ```bash
   npm run dev
   ```

## Default Admin

- Email: value from `DEFAULT_ADMIN_EMAIL`
- Password: value from `DEFAULT_ADMIN_PASSWORD`

## PhonePe Notes

The payment service uses the current Standard Checkout flow documented by PhonePe:
- OAuth token generation
- Create payment request
- Order status verification

Configure `PHONEPE_REDIRECT_URL` to the backend redirect endpoint and `PHONEPE_REDIRECT_FRONTEND_SUCCESS` / `PHONEPE_REDIRECT_FRONTEND_FAILURE` to your frontend routes.
