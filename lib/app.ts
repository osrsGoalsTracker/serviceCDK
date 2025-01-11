import * as cdk from 'aws-cdk-lib';
import { ApiGatewayStack } from './stacks/api-gateway-stack';
import { GetCharacterHiscoresStack } from './stacks/get-character-hiscores-stack';
import { GoalTrackerTableStack } from './stacks/goal-tracker-table-stack';
import { CreateUserStack } from './stacks/create-user-stack';
import { GetUserStack } from './stacks/get-user-stack';
import { AddCharacterToUserStack } from './stacks/add-character-to-user-stack';
import { GetCharactersForUserStack } from './stacks/get-characters-for-user-stack';
import { CreateNotificationChannelForUserStack } from './stacks/create-notification-channel-for-user-stack';
import { GetNotificationChannelsForUserStack } from './stacks/get-notification-channels-for-user-stack';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

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

// Create GoalTracker DynamoDB table stack first (independent)
const goalTrackerTableStack = new GoalTrackerTableStack(app, 'GoalTrackerTableStack', {
    env,
    description: `OSRS GoalTracker DynamoDB Table - ${stage}`,
    stackName: `GoalTrackerTable-${stage}`,
    tags: {
        Stage: stage,
        Project: 'OSRS Goals'
    }
});

// Create GetCharacterStats Lambda stack (independent)
const getCharacterHiscoresStack = new GetCharacterHiscoresStack(app, 'GetCharacterHiscoresStack', {
    env,
    description: `OSRS Goals GetCharacterHiscores Lambda - ${stage}`,
    stackName: `GetCharacterHiscores-${stage}`,
    tags: {
        Stage: stage,
        Project: 'OSRS Goals'
    }
});

// Create CreateUser Lambda stack (depends on GoalTracker table)
const createUserStack = new CreateUserStack(app, 'CreateUserStack', {
    env,
    description: `OSRS Goals CreateUser Lambda - ${stage}`,
    stackName: `CreateUser-${stage}`,
    goalTrackerTableStack,
    tags: {
        Stage: stage,
        Project: 'OSRS Goals'
    }
});

// Create GetUser Lambda stack (depends on GoalTracker table)
const getUserStack = new GetUserStack(app, 'GetUserStack', {
    env,
    description: `OSRS Goals GetUser Lambda - ${stage}`,
    stackName: `GetUser-${stage}`,
    goalTrackerTableStack,
    tags: {
        Stage: stage,
        Project: 'OSRS Goals'
    }
});

// Create AddCharacterToUser Lambda stack (depends on GoalTracker table)
const addCharacterToUserStack = new AddCharacterToUserStack(app, 'AddCharacterToUserStack', {
    env,
    description: `OSRS Goals AddCharacterToUser Lambda - ${stage}`,
    stackName: `AddCharacterToUser-${stage}`,
    goalTrackerTableStack,
    tags: {
        Stage: stage,
        Project: 'OSRS Goals'
    }
});

// Create GetCharactersForUser Lambda stack (depends on GoalTracker table)
const getCharactersForUserStack = new GetCharactersForUserStack(app, 'GetCharactersForUserStack', {
    env,
    description: `OSRS Goals GetCharactersForUser Lambda - ${stage}`,
    stackName: `GetCharactersForUser-${stage}`,
    goalTrackerTableStack,
    tags: {
        Stage: stage,
        Project: 'OSRS Goals'
    }
});

// Create CreateNotificationChannelForUser Lambda stack (depends on GoalTracker table)
const createNotificationChannelForUserStack = new CreateNotificationChannelForUserStack(app, 'CreateNotificationChannelForUserStack', {
    env,
    description: `OSRS Goals CreateNotificationChannelForUser Lambda - ${stage}`,
    stackName: `CreateNotificationChannelForUser-${stage}`,
    goalTrackerTableStack,
    tags: {
        Stage: stage,
        Project: 'OSRS Goals'
    }
});

// Create GetNotificationChannelsForUser Lambda stack (depends on GoalTracker table)
const getNotificationChannelsForUserStack = new GetNotificationChannelsForUserStack(app, 'GetNotificationChannelsForUserStack', {
    env,
    description: `OSRS Goals GetNotificationChannelsForUser Lambda - ${stage}`,
    stackName: `GetNotificationChannelsForUser-${stage}`,
    goalTrackerTableStack,
    tags: {
        Stage: stage,
        Project: 'OSRS Goals'
    }
});

// Create API Gateway stack (depends on Lambdas)
new ApiGatewayStack(app, 'ApiGatewayStack', {
    env,
    description: `OSRS Goals API Gateway - ${stage}`,
    stackName: `ApiGateway-${stage}`,
    parameterDefinitions: {
        // Path parameters
        '{userId}': {
            name: 'userId',
            type: apigateway.JsonSchemaType.STRING,
            required: true,
            source: 'path',
            template: '$util.escapeJavaScript($input.params(\'userId\'))'
        },
        '{name}': {
            name: 'name',
            type: apigateway.JsonSchemaType.STRING,
            required: true,
            source: 'path',
            template: '$util.escapeJavaScript($input.params(\'name\'))'
        },
        // Body parameters for POST /users
        'users': {
            name: 'email',
            type: apigateway.JsonSchemaType.STRING,
            required: true,
            source: 'body',
            template: '$input.json(\'$.email\')'
        }
    },
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
            resourcePath: ['characters', '{name}', 'hiscores'],
            lambda: getCharacterHiscoresStack.getCharacterHiscoresFunction,
            operationName: 'GetCharacterHiscores'
        },
        {
            httpMethod: 'POST',
            resourcePath: ['users', '{userId}', 'characters', '{name}'],
            lambda: addCharacterToUserStack.addCharacterToUserFunction,
            operationName: 'AddCharacterToUser'
        },
        {
            httpMethod: 'GET',
            resourcePath: ['users', '{userId}', 'characters'],
            lambda: getCharactersForUserStack.getCharactersForUserFunction,
            operationName: 'GetCharactersForUser'
        },
        {
            httpMethod: 'POST',
            resourcePath: ['users', '{userId}', 'notification-channels'],
            lambda: createNotificationChannelForUserStack.createNotificationChannelForUserFunction,
            operationName: 'CreateNotificationChannelForUser'
        },
        {
            httpMethod: 'GET',
            resourcePath: ['users', '{userId}', 'notification-channels'],
            lambda: getNotificationChannelsForUserStack.getNotificationChannelsForUserFunction,
            operationName: 'GetNotificationChannelsForUser'
        }
    ],
    tags: {
        Stage: stage,
        Project: 'OSRS Goals'
    }
});

app.synth(); 