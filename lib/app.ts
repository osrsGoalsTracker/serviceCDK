import * as cdk from 'aws-cdk-lib';
import { ApiGatewayStack } from './stacks/api-gateway-stack';
import { GetPlayerStatsStack } from './stacks/get-player-stats-stack';
import { GoalTableStack } from './stacks/goal-table-stack';
import { CreateUserStack } from './stacks/create-user-stack';
import { GetUserStack } from './stacks/get-user-stack';

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

// Create Goal DynamoDB table stack first (independent)
const goalTableStack = new GoalTableStack(app, 'GoalTableStack', {
    env,
    description: `OSRS Goals DynamoDB Table - ${stage}`,
    stackName: `osrs-goals-goal-table-${stage}`,
    tags: {
        Stage: stage,
        Project: 'OSRS Goals'
    }
});

// Create GetPlayerStats Lambda stack (independent)
const getPlayerStatsStack = new GetPlayerStatsStack(app, 'GetPlayerStatsStack', {
    env,
    description: `OSRS Goals GetPlayerStats Lambda - ${stage}`,
    stackName: `osrs-goals-get-player-stats-${stage}`,
    tags: {
        Stage: stage,
        Project: 'OSRS Goals'
    }
});

// Create CreateUser Lambda stack (depends on Goal table)
const createUserStack = new CreateUserStack(app, 'CreateUserStack', {
    env,
    description: `OSRS Goals CreateUser Lambda - ${stage}`,
    stackName: `osrs-goals-create-user-${stage}`,
    goalTableStack,
    tags: {
        Stage: stage,
        Project: 'OSRS Goals'
    }
});

// Create GetUser Lambda stack (depends on Goal table)
const getUserStack = new GetUserStack(app, 'GetUserStack', {
    env,
    description: `OSRS Goals GetUser Lambda - ${stage}`,
    stackName: `osrs-goals-get-user-${stage}`,
    goalTableStack,
    tags: {
        Stage: stage,
        Project: 'OSRS Goals'
    }
});

// Create API Gateway stack (depends on Lambdas)
new ApiGatewayStack(app, 'ApiGatewayStack', {
    env,
    description: `OSRS Goals API Gateway - ${stage}`,
    stackName: `osrs-goals-api-gateway-${stage}`,
    routes: [
        {
            httpMethod: 'POST',
            resourcePath: ['users'],
            lambda: createUserStack.createUserFunction,
            operationName: 'CreateUser'
        },
        {
            httpMethod: 'GET',
            resourcePath: ['users', '{userId}'],
            lambda: getUserStack.getUserFunction,
            operationName: 'GetUser'
        },
        {
            httpMethod: 'GET',
            resourcePath: ['users', '{userId}', 'players', '{rsn}', 'stats'],
            lambda: getPlayerStatsStack.getPlayerStatsFunction,
            operationName: 'GetPlayerStats'
        }
    ],
    tags: {
        Stage: stage,
        Project: 'OSRS Goals'
    }
});

app.synth(); 