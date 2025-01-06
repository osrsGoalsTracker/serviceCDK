# OSRS Goals CDK Infrastructure

AWS CDK infrastructure code for the OSRS Goals application, which tracks Old School RuneScape player goals.

## Prerequisites

- Node.js v22 (use nvm to install: `nvm install 22 && nvm use 22`)
- AWS CLI configured with appropriate credentials
- AWS CDK CLI (`npm install -g aws-cdk`)

## AWS Setup

1. Install AWS CLI:
```bash
# macOS
brew install awscli

# Windows
choco install awscli

# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

2. Configure AWS credentials:
```bash
# Configure your AWS credentials
aws configure

# When prompted, enter:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region (e.g., us-west-2)
# - Default output format (json)
```

You can get your AWS credentials from:
1. AWS Console → IAM → Users → Your User → Security credentials → Create access key
2. Save both the Access Key ID and Secret Access Key

## Installation

1. Install dependencies:
```bash
npm install
```

2. Build the project:
```bash
npm run build
```

## Deployment

Deploy the infrastructure using:

```bash
# Deploy all stacks
cdk deploy "*" --context stage=dev --context account=123456789012 [--context region=us-west-2]

# Deploy specific stacks (note: dependencies will be deployed automatically)
cdk deploy GetUserStack --context stage=dev --context account=123456789012 [--context region=us-west-2]
cdk deploy CreateUserStack --context stage=dev --context account=123456789012 [--context region=us-west-2]
```

Required parameters:
- `stage`: Environment name (e.g., dev, prod)
- `account`: AWS account ID where you want to deploy

Optional parameters:
- `region`: AWS region (defaults to us-west-2)

Stack Dependencies:
- `GoalTrackerTableStack` - Independent
- `GetPlayerStatsStack` - Independent
- `CreateUserStack` - Depends on GoalTrackerTableStack
- `GetUserStack` - Depends on GoalTrackerTableStack
- `ApiGatewayStack` - Depends on all Lambda stacks

## API Endpoints

The service exposes:

### POST /users

Creates a new user account.

**Request Body:**
```json
{
    "email": "string"
}
```

**Response:**
```json
{
    "userId": "string",
    "email": "string"
}
```

### GET /users/{userId}

Retrieves user information.

**Parameters:**
- `userId` (path parameter) - The user's unique identifier

**Response:**
```json
{
    "userId": "string",
    "email": "string"
}
```

### GET /users/{userId}/players/{rsn}/stats

Retrieves player's OSRS stats for a specific user's registered player.

**Parameters:**
- `userId` (path parameter) - The user's unique identifier
- `rsn` (path parameter) - RuneScape username

**Response:**
```json
{
    "rsn": "string",
    "stats": {
        "overall": {
            "rank": number,
            "level": number,
            "xp": number
        }
    }
}
```

## Useful Commands

- `npm run build` - Compile TypeScript
- `npm run watch` - Watch for changes
- `npm run test` - Run tests
- `cdk list --context stage=dev --context account=<account-id>` - List all defined stacks
- `cdk diff --context stage=dev --context account=<account-id>` - Show deployment changes
- `cdk synth --context stage=dev --context account=<account-id>` - Emit CloudFormation template
- `./updateDevLambda.sh <FunctionName>` - Update Lambda function code in dev environment
  - Example: `./updateDevLambda.sh CreateUser`
  - Available functions: CreateUser, GetUser, GetPlayerStats
  - Automatically uses the correct jar file from ../service/build/libs/

## Security Notes

- Never commit AWS credentials to the repository
- Use appropriate AWS credentials for each environment
- Ensure you're deploying to the correct AWS account
- Always verify the stage and account before deployment

## Infrastructure Components

The infrastructure includes:
- API Gateway for REST endpoints:
  - User management endpoints:
    - Create user (with DynamoDB write access)
    - Get user information (with DynamoDB read access)
  - Player statistics endpoints
- Lambda functions for business logic:
  - CreateUser function for user registration (with DynamoDB write access)
    - Name format: `CreateUser-${stage}`
  - GetUser function for retrieving user information (with DynamoDB read access)
    - Name format: `GetUser-${stage}`
  - GetPlayerStats function for retrieving player statistics
    - Name format: `GetPlayerStats-${stage}`
  - All functions use simple stage suffix (e.g., `-dev` or `-prod`)
- DynamoDB tables:
  - GoalTrackerTable (pk/sk) for storing player goals and progress tracking
    - Table name format: `goalTracker-${stage}`
    - Partition key (pk): String
    - Sort key (sk): String
    - Global Secondary Indexes:
      - email-id-index:
        - Partition key (email): String
        - Sort key (id): String
        - Projection: ALL
    - Pay-per-request billing
    - Point-in-time recovery enabled
    - Used by CreateUser and GetUser functions
- Appropriate IAM roles and permissions

## Contributing

1. Create a feature branch
2. Make your changes
3. Write tests
4. Create a pull request

## License

MIT 