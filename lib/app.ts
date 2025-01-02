import * as cdk from 'aws-cdk-lib';
import { ApiGatewayStack } from './stacks/api-gateway-stack';
import { GetPlayerStatsStack } from './stacks/get-player-stats-stack';
import { GoalTableStack } from './stacks/goal-table-stack';

const app = new cdk.App();

// Get deployment configuration from context
const stage = app.node.tryGetContext('stage');
const region = app.node.tryGetContext('region') || 'us-west-2';
const account = app.node.tryGetContext('account');

// Validate required parameters
if (!stage) {
    throw new Error('Stage must be specified with --context stage=<stage>');
}

if (!account) {
    throw new Error('AWS account must be specified with --context account=<account-id>');
}

// Create environment configuration
const env: cdk.Environment = {
    account,
    region
};

// Create API Gateway stack
const apiGatewayStack = new ApiGatewayStack(app, 'ApiGatewayStack', {
    env,
    description: `OSRS Goals API Gateway - ${stage}`,
    stackName: `osrs-goals-api-gateway-${stage}`,
    tags: {
        Stage: stage,
        Project: 'OSRS Goals'
    }
});

// Create GetPlayerStats Lambda stack
new GetPlayerStatsStack(app, 'GetPlayerStatsStack', {
    env,
    description: `OSRS Goals GetPlayerStats Lambda - ${stage}`,
    stackName: `osrs-goals-get-player-stats-${stage}`,
    apiGatewayStack,
    tags: {
        Stage: stage,
        Project: 'OSRS Goals'
    }
});

// Create Goal DynamoDB table stack
new GoalTableStack(app, 'GoalTableStack', {
    env,
    description: `OSRS Goals DynamoDB Table - ${stage}`,
    stackName: `osrs-goals-goal-table-${stage}`,
    tags: {
        Stage: stage,
        Project: 'OSRS Goals'
    }
});

app.synth(); 