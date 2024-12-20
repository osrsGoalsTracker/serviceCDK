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

## Deployment

To deploy the infrastructure to your AWS account:

1. Make sure you have AWS credentials configured for the target account
2. Build the project:
```bash
npm run build
```

3. Deploy the stack:
```bash
cdk deploy --context stage=dev --profile <your aws-profile>
```

The `stage` parameter is required and will be used to name all resources. The profile is the AWS profile to use for the deployment. To find your profile name, run `aws configure list-profiles`. If you don't have a profile, you can create one with `aws configure`.

This will create resources with names like:
- `PlayerStack-dev` or `PlayerStack-prod` (CloudFormation stack)
- `Player-dev` or `Player-prod` (DynamoDB table)
- `player-api-dev` or `player-api-prod` (API Gateway)

This naming convention helps you easily identify which environment each resource belongs to when viewing them in the AWS Console.

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
- `cdk diff --context stage=<stage-name>` - Compare deployed stack with current state
- `cdk synth --context stage=<stage-name>` - Emits the synthesized CloudFormation template

## Security Notes

- Never commit AWS credentials to the repository
- Use appropriate AWS profiles for different environments
- Use AWS credentials with appropriate permissions for your target account
- Always verify the stage parameter matches your intended environment before deployment

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