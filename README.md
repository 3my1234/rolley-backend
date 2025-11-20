# Rolley Backend

This is the NestJS backend for the Rolley platform, handling all API endpoints, business logic, and database operations.

## Features

- **Authentication**: Privy integration for Web3 and social logins
- **User Management**: User profiles, referrals, and role-based access
- **Stake Management**: Create, participate in, and complete stakes
- **Token System**: ROL token distribution and milestone card rewards
- **Daily Events**: AI-powered match analysis and event creation
- **Blockchain Integration**: Polygon network for token transactions
- **Admin Dashboard**: User management and system configuration
- **n8n Integration**: Automated workflow management

## Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Privy + JWT
- **Blockchain**: Ethers.js + Polygon
- **AI**: Google Gemini API
- **Payments**: Flutterwave
- **Automation**: n8n

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Privy account
- Polygon wallet
- Google Gemini API key
- Flutterwave account
- n8n instance

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp env.example .env
# Edit .env with your configuration
```

3. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

4. Start the development server:
```bash
npm run start:dev
```

## API Endpoints

### Authentication
- `POST /auth/sync` - Sync user data with Privy
- `POST /auth/login` - Login with JWT
- `POST /auth/refresh` - Refresh JWT token

### Users
- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update user profile
- `GET /users/referrals` - Get user referrals

### Stakes
- `POST /stakes/create` - Create new stake
- `POST /stakes/participate` - Participate in daily stake
- `GET /stakes/active` - Get active stakes
- `GET /stakes/history` - Get stake history

### Tokens
- `GET /tokens/balance` - Get token balance
- `POST /tokens/convert` - Convert tokens to cash
- `GET /tokens/rewards` - Get reward history

### Daily Events
- `GET /daily-events/current` - Get current daily event
- `GET /daily-events/history` - Get event history

### Admin
- `GET /admin/users` - Get all users
- `PUT /admin/users/:id` - Update user
- `GET /admin/stats` - Get system statistics

## Database Schema

The database uses Prisma ORM with the following main models:

- **User**: User profiles and authentication
- **Stake**: Stake information and status
- **DailyEvent**: Daily match events
- **Transaction**: Financial transactions
- **TokenReward**: Token reward records
- **Airdrop**: Token airdrop records
- **TokenConversion**: Cash conversion records

## Configuration

### Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `PRIVY_APP_ID`: Privy application ID
- `PRIVY_APP_SECRET`: Privy application secret
- `JWT_SECRET`: JWT signing secret
- `POLYGON_RPC_URL`: Polygon RPC endpoint
- `PRIVATE_KEY`: Wallet private key
- `CONTRACT_ADDRESS`: ROL token contract address
- `GEMINI_API_KEY`: Google Gemini API key
- `FLUTTERWAVE_PUBLIC_KEY`: Flutterwave public key
- `FLUTTERWAVE_SECRET_KEY`: Flutterwave secret key
- `N8N_API_KEY`: n8n API key
- `N8N_BASE_URL`: n8n base URL

## Deployment

### Production Setup

1. Set up PostgreSQL database
2. Configure environment variables
3. Deploy to Railway, Render, Fly.io, or AWS ECS
4. Set up monitoring and logging

### Docker

```bash
docker build -t rolley-backend .
docker run -p 3001:3001 rolley-backend
```

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License
