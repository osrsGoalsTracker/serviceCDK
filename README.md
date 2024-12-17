# OSRS Goals CDK Infrastructure

AWS CDK infrastructure code for the OSRS Goals application, which tracks Old School RuneScape player goals.

## Prerequisites

- Node.js v22 (use nvm to install: `nvm install 22 && nvm use 22`)
- AWS CLI configured with appropriate credentials
- AWS CDK CLI (`npm install -g aws-cdk`)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Build the project:
```bash
npm run build
```

## Configuration

The infrastructure can be deployed to different stages (environments):

- `prod`: Production environment
- `beta`: Beta testing environment
- `developer`: Personal development environment

### Developer Setup

For local development, you'll need to update the developer account ID in `src/config.ts`. Find the `developer` stage configuration and replace the accountId with your AWS account ID:

```typescript
developer: {
    accountId: 'YOUR_AWS_ACCOUNT_ID', // Replace with your AWS account ID
    region: 'us-west-2'
}
```

> **Note**: The default developer account ID (084375548651) is just an example. Each developer should use their own AWS account ID.

## Deployment

To deploy the infrastructure to a specific stage:

1. Make sure you have AWS credentials configured for the target account
2. Build the project:
```bash
npm run build
```

3. Deploy to your chosen stage:
```bash
cdk deploy --app 'npx ts-node src/app.ts' --context stage=STAGE_NAME
```

Replace `STAGE_NAME` with one of:
- `prod` (Production)
- `beta` (Beta testing)
- `developer` (Local development)

Example for deploying to your developer environment:
```bash
cdk deploy --app 'npx ts-node src/app.ts' --context stage=developer
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
    "lastUpdated": "string"
}
```

### POST /players/{rsn}

Creates or updates player information.

**Parameters:**
- `rsn` (path parameter) - RuneScape username

## Useful Commands

- `npm run build` - Compile TypeScript to JavaScript
- `npm run watch` - Watch for changes and compile
- `npm run test` - Perform the jest unit tests
- `cdk diff` - Compare deployed stack with current state
- `cdk synth` - Emits the synthesized CloudFormation template

## Security Notes

- Never commit your personal AWS account ID to the repository
- Always verify the target account ID before deploying to production
- Use AWS credentials with appropriate permissions for your stage

## Infrastructure Components

The infrastructure includes:
- DynamoDB table for player data
- Lambda functions for API handlers
- API Gateway for RESTful endpoints
- Appropriate IAM roles and permissions

## Contributing

1. Create a feature branch
2. Make your changes
3. Write tests
4. Create a pull request

## License

MIT 