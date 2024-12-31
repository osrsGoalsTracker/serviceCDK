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
# Deploy to development
cdk deploy "*" --context stage=dev --context account=123456789012 [--context region=us-west-2]

# Deploy to production
cdk deploy "*" --context stage=prod --context account=987654321098 [--context region=us-west-2]
```

Required parameters:
- `stage`: Environment name (e.g., dev, prod)
- `account`: AWS account ID where you want to deploy

Optional parameters:
- `region`: AWS region (defaults to us-west-2)

The deployment will create:
- API Gateway with base path `/players/{rsn}`
- Lambda function for retrieving player stats
- All resources will be tagged with the specified stage

## API Endpoints

The service exposes:

### GET /players/{rsn}/stats

Retrieves player's OSRS stats.

**Parameters:**
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
- `cdk diff --context stage=dev --context account=<account-id>` - Show deployment changes
- `cdk synth --context stage=dev --context account=<account-id>` - Emit CloudFormation template

## Security Notes

- Never commit AWS credentials to the repository
- Use appropriate AWS credentials for each environment
- Ensure you're deploying to the correct AWS account
- Always verify the stage and account before deployment

## Infrastructure Components

The infrastructure includes:
- API Gateway for REST endpoints
- Lambda functions for business logic
- Appropriate IAM roles and permissions

## Contributing

1. Create a feature branch
2. Make your changes
3. Write tests
4. Create a pull request

## License

MIT 