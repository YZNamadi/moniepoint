# Moniepoint Agent Performance & Settlement Reporting Engine

A backend microservice that handles agent performance tracking, commission calculations, and settlement reporting for Moniepoint agents, with support for agent markup handling.

## Features

- Transaction processing with markup support
- Real-time performance metrics
- Commission calculation (standard + markup)
- Suspicious activity detection
- Redis caching for improved performance
- Webhook support for real-time notifications
- Admin analytics for regional performance

## Tech Stack

- Node.js with Express
- TypeScript
- MySQL for persistent storage
- Redis for caching
- Docker & Docker Compose
- PM2 for process management

## Prerequisites

- Docker and Docker Compose
- Node.js 18 or higher
- npm or yarn

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd moniepoint-agent-performance
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```
   Update the environment variables as needed.

4. Start the services using Docker Compose:
   ```bash
   docker-compose up -d
   ```

## API Endpoints

### Transactions

- **POST /api/transactions**
  - Create a new transaction
  - Body:
    ```json
    {
      "agent_id": "string",
      "amount": "number",
      "transaction_type": "cashout|deposit",
      "agent_markup": "number",
      "customer_phone": "string",
      "notes": "string"
    }
    ```

- **GET /api/transactions/agent/:agent_id**
  - Get agent's transactions
  - Query params:
    - start_date (optional)
    - end_date (optional)

- **GET /api/transactions/agent/:agent_id/performance**
  - Get agent's performance metrics

### Admin Analytics

- **GET /api/admin/top-agents**
  - Get top performing agents

- **GET /api/admin/region-performance**
  - Get regional performance metrics

### Webhooks

- **POST /api/webhooks/subscribe**
  - Subscribe to webhook notifications
  - Body:
    ```json
    {
      "agent_id": "string",
      "url": "string"
    }
    ```

## Development

1. Start development server:
   ```bash
   npm run dev
   ```

2. Build the project:
   ```bash
   npm run build
   ```

3. Run tests:
   ```bash
   npm test
   ```

4. Lint code:
   ```bash
   npm run lint
   ```

## Docker Commands

- Build and start services:
  ```bash
  docker-compose up --build
  ```

- Stop services:
  ```bash
  docker-compose down
  ```

- View logs:
  ```bash
  docker-compose logs -f app
  ```

## Database Schema

The project uses MySQL with the following main tables:
- `agents`: Agent information
- `transactions`: Transaction records
- `regions`: Regional data
- `webhook_subscriptions`: Webhook configurations
- `performance_metrics`: Cached performance data
- `audit_logs`: System audit trail

## Caching Strategy

- Redis is used to cache:
  - Agent performance metrics (5-minute TTL)
  - Transaction lists (5-minute TTL)
  - Regional statistics (5-minute TTL)

## Error Handling

The service includes comprehensive error handling for:
- Invalid transaction amounts
- Invalid markup values
- Suspicious activity detection
- Database connection issues
- Redis cache failures

## Monitoring

- PM2 is used for process management and basic monitoring
- Winston logger for application logging
- Docker health checks for container monitoring

## Security

- Helmet.js for HTTP security headers
- Input validation using express-validator
- Rate limiting for API endpoints
- Secure webhook secret generation

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the ISC License. 