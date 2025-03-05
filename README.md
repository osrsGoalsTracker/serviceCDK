# OSRS Goals CDK Infrastructure

AWS CDK infrastructure code for the OSRS Goals application, which tracks Old School RuneScape player goals.

## Prerequisites

- Node.js v22 (use nvm to install: `nvm install 22 && nvm use 22`)
- AWS CLI configured with appropriate credentials
- AWS CDK CLI (`npm install -g aws-cdk`)
- Python 3.11 (for Lambda tester)

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
- `GoalEventBusStack` - Independent
- `CreateUserStack` - Depends on GoalTrackerTableStack
- `GetUserStack` - Depends on GoalTrackerTableStack
- `CreateGoalFromEventStack` - Depends on GoalEventBusStack and GoalTrackerTableStack
- `GoalCreationRequestEventProducerStack` - Depends on GoalEventBusStack
- `ApiGatewayStack` - Depends on all Lambda stacks
- `LambdaTesterStack` - Depends on all Lambda stacks

## Event Bus

The service uses EventBridge for event-driven communication between components. The following events are supported:

### GoalCreationEvent

Event published when a goal is requested to be created.

**Event Detail Type:** `GoalCreationEvent`

**Event Detail:**
```json
{
    "userId": "string",
    "characterName": "string",
    "targetAttribute": "string",
    "targetType": "string",
    "targetValue": "number",
    "currentValue": "number",
    "targetDate": "string (ISO-8601)",
    "notificationChannelType": "string",
    "frequency": "string"
}
```

## Lambda Functions

### CreateGoalFromEvent

Processes GoalCreationEvents from the EventBus and creates goals in the DynamoDB table.

**Input:** EventBridge event with GoalCreationEvent detail
**Output:** None (writes to DynamoDB)

### GoalCreationRequestEventProducer

Processes API requests to create goals and publishes GoalCreationEvents to the EventBus.

**Input:** API Gateway event with path parameters (userId, name) and request body
**Output:** API Gateway response with 200 status code

## Lambda Tester

The Lambda Tester is a Python-based Lambda function that tests all other Lambda functions in the application. It simulates API Gateway requests and verifies that each Lambda returns a 200 status code.

### Test Cases

The tester includes test cases for each Lambda function:

```python
{
    'CreateUser': {
        'body': {
            'email': 'test@example.com'
        }
    },
    'GetUser': {
        'pathParameters': {
            'userId': 'test-user-id'
        }
    },
    'GetCharacterHiscores': {
        'pathParameters': {
            'name': 'test-character'
        }
    },
    'AddCharacterToUser': {
        'pathParameters': {
            'userId': 'test-user-id'
        },
        'body': {
            'name': 'test-character'
        }
    },
    'GetCharactersForUser': {
        'pathParameters': {
            'userId': 'test-user-id'
        }
    },
    'CreateNotificationChannelForUser': {
        'pathParameters': {
            'userId': 'test-user-id'
        },
        'body': {
            'type': 'EMAIL',
            'destination': 'test@example.com'
        }
    },
    'GetNotificationChannelsForUser': {
        'pathParameters': {
            'userId': 'test-user-id'
        }
    },
    'GoalCreationRequestEventProducer': {
        'pathParameters': {
            'userId': 'test-user-id',
            'name': 'test-character'
        },
        'body': {
            'targetAttribute': 'WOODCUTTING',
            'targetType': 'SKILL',
            'targetValue': 99,
            'currentValue': 1,
            'targetDate': '2024-12-31T23:59:59Z',
            'notificationChannelType': 'EMAIL',
            'frequency': 'DAILY'
        }
    }
}
```

### Running Tests

To run the Lambda tester:

1. Deploy the tester:
```bash
./updateDevLambda.sh LambdaTester
```

2. Invoke the tester through AWS Console or CLI:
```bash
aws lambda invoke \
    --function-name LambdaTester-dev \
    --payload '{}' \
    response.json
```

3. Check the results in `response.json`:
```json
{
    "statusCode": 200,
    "body": {
        "results": [
            {
                "function": "CreateUser",
                "status": "PASS",
                "statusCode": 200
            },
            // ... more results ...
        ],
        "summary": {
            "total": 7,
            "passed": 7,
            "failed": 0,
            "errors": 0
        }
    }
}
```

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

### GET /players/{name}/stats

Retrieves player's OSRS stats.

**Parameters:**
- `name` (path parameter) - RuneScape username

**Response:**
```json
{
    "name": "string",
    "stats": {
        "overall": {
            "rank": number,
            "level": number,
            "xp": number
        }
    }
}
```

### POST /users/{userId}/players/{name}

Adds a player to a user's account.

**Parameters:**
- `userId` (path parameter) - The user's unique identifier
- `name` (path parameter) - RuneScape username to add

**Response:**
```json
{
    "userId": "string",
    "name": "string",
    "added": true
}
```

### GET /users/{userId}/players

Retrieves all players associated with a user's account.

**Parameters:**
- `userId` (path parameter) - The user's unique identifier

**Response:**
```json
{
    "userId": "string",
    "players": [
        {
            "name": "string",
            "addedAt": "timestamp"
        }
    ]
}
```

### POST /users/{userId}/notification-channels

Creates a notification channel for a user.

**Parameters:**
- `userId` (path parameter) - The user's unique identifier

**Request Body:**
```json
{
    "type": "EMAIL",
    "destination": "string"
}
```

**Response:**
```json
{
    "userId": "string",
    "channelId": "string",
    "type": "EMAIL",
    "destination": "string"
}
```

### GET /users/{userId}/notification-channels

Retrieves all notification channels for a user.

**Parameters:**
- `userId` (path parameter) - The user's unique identifier

**Response:**
```json
{
    "userId": "string",
    "channels": [
        {
            "channelId": "string",
            "type": "EMAIL",
            "destination": "string"
        }
    ]
}
```

### POST /users/{userId}/characters/{name}/goal

Creates a goal for a character.

**Parameters:**
- `userId` (path parameter) - The user's unique identifier
- `name` (path parameter) - RuneScape username

**Request Body:**
```json
{
    "targetAttribute": "string",
    "targetType": "string",
    "targetValue": number,
    "currentValue": number,
    "targetDate": "string (ISO-8601)",
    "notificationChannelType": "string",
    "frequency": "string"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Goal creation request submitted"
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
  - Available functions: CreateUser, GetUser, GetPlayerStats, AddCharacterToUser, GetCharactersForUser, CreateNotificationChannelForUser, GetNotificationChannelsForUser, GoalCreationRequestEventProducer, LambdaTester
  - Automatically uses the correct jar file from ../service/build/libs/
- `./updateAllDevLambdas.sh` - Update all Lambda functions at once

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
    - Add player to user (with DynamoDB read/write access)
  - Player statistics endpoints
  - Notification channel endpoints
  - Goal management endpoints:
    - Create goal for character (with EventBus write access)
- Lambda functions for business logic:
  - CreateUser function for user registration (with DynamoDB write access)
    - Name format: `CreateUser-${stage}`
  - GetUser function for retrieving user information (with DynamoDB read access)
    - Name format: `GetUser-${stage}`
  - GetPlayerStats function for retrieving player statistics
    - Name format: `GetPlayerStats-${stage}`
  - AddPlayerToUser function for adding players to users (with DynamoDB read/write access)
    - Name format: `AddPlayerToUser-${stage}`
  - CreateNotificationChannelForUser function for creating notification channels (with DynamoDB write access)
    - Name format: `CreateNotificationChannelForUser-${stage}`
  - GetNotificationChannelsForUser function for retrieving notification channels (with DynamoDB read access)
    - Name format: `GetNotificationChannelsForUser-${stage}`
  - GoalCreationRequestEventProducer function for creating goal creation requests (with EventBus write access)
    - Name format: `GoalCreationRequestEventProducer-${stage}`
  - CreateGoalFromGoalCreationRequestEvent function for processing goal creation events (with DynamoDB write access)
    - Name format: `CreateGoalFromGoalCreationRequestEvent-${stage}`
  - LambdaTester function for testing all other Lambda functions
    - Name format: `LambdaTester-${stage}`
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
- EventBridge event bus:
  - GoalEventBus for event-driven communication
    - Bus name format: `goal-event-bus-${stage}`
    - Used for goal creation workflow
- Appropriate IAM roles and permissions

## Contributing

1. Create a feature branch
2. Make your changes
3. Write tests
4. Create a pull request

## License

MIT 