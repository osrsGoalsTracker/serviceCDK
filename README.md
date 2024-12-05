# OSRS XP Goals Service

A Java-based AWS Lambda service for tracking Old School RuneScape player XP goals.

## Project Structure

The project consists of two main components:

1. `service/` - Java service with Lambda handlers and business logic
2. `cdk/` - AWS CDK infrastructure code in TypeScript

## Prerequisites

- Java 21
- Node.js 18+
- AWS CLI configured with appropriate credentials
- Maven
- AWS CDK CLI

## Building the Service

### Build the Java Service

```bash
cd service
mvn clean package
```

### Build the CDK Infrastructure

```bash
cd cdk
npm install
npm run build
```

## Deployment

The service can be deployed to different stages (e.g., alpha, beta) using the CDK.

1. First, update the account IDs in `cdk/src/config.ts` with your AWS account IDs.

2. Deploy to a specific stage:

```bash
cd cdk
cdk deploy --context stage=alpha
```

## API Endpoints

The service exposes two API endpoints:

### GET /players/{rsn}

Retrieves player information.

**Parameters:**
- `rsn` (path parameter) - RuneScape username

**Response:**
```json
{
    "rsn": "string",
    "totalXp": number,
    "combatLevel": number,
    "lastUpdated": "string"
}
```

### POST /players/{rsn}

Creates or updates player information.

**Parameters:**
- `rsn` (path parameter) - RuneScape username
- Request body:
```json
{
    "totalXp": number,
    "combatLevel": number
}
```

## Testing

### Run Java Tests

```bash
cd service
mvn test
```

## Development

The service follows a layered architecture:

1. Lambda Layer (`lambda/`) - Handles AWS Lambda requests
2. Data Layer (`data/`) - Business logic and data coordination
3. Persistence Layer (`persistence/`) - Data storage operations
4. External Layer (`external/`) - External service interactions

## Contributing

1. Create a feature branch
2. Make your changes
3. Write tests
4. Create a pull request

## License

MIT 