import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import config from '../config';
import { GOAL_CREATION_REQUEST_EVENT_DETAIL_TYPE } from '../constants';
interface CreateGoalFromGoalCreationRequestEventStackProps extends cdk.StackProps {
    eventBus: events.EventBus;
    goalTrackerTable: dynamodb.Table;
}

export class CreateGoalFromGoalCreationRequestEventStack extends cdk.Stack {
    public readonly createGoalLambda: lambda.Function;

    constructor(scope: Construct, id: string, props: CreateGoalFromGoalCreationRequestEventStackProps) {
        super(scope, id, props);

        const stage = this.node.tryGetContext('stage') || 'dev';
        const stackConfig = config.stacks.createGoalFromGoalCreationRequestEvent;

        if (!stackConfig.lambda) {
            throw new Error('Lambda configuration missing for CreateGoalFromGoalCreationRequestEvent stack');
        }

        // Create Lambda function
        this.createGoalLambda = new lambda.Function(this, 'CreateGoalFromGoalCreationRequestEventLambda', {
            runtime: lambda.Runtime.JAVA_21,
            handler: stackConfig.lambda.handler,
            code: lambda.Code.fromAsset(stackConfig.lambda.jarPath),
            memorySize: 512,
            timeout: cdk.Duration.seconds(30),
            functionName: `${stackConfig.lambda.name}-${stage}`,
            environment: {
                GOAL_TRACKER_TABLE_NAME: props.goalTrackerTable.tableName,
                STAGE: stage
            }
        });

        // Grant DynamoDB permissions
        props.goalTrackerTable.grantWriteData(this.createGoalLambda);

        // Add the Lambda as a target for the GoalCreationRequestEvent rule
        new events.Rule(this, 'GoalCreationRequestEventToLambdaRule', {
            eventBus: props.eventBus,
            ruleName: `goal-creation-request-event-to-lambda-${stage}`,
            description: 'Forward goal creation request events to create goal lambda',
            eventPattern: {
                detailType: [GOAL_CREATION_REQUEST_EVENT_DETAIL_TYPE],
            },
            targets: [new targets.LambdaFunction(this.createGoalLambda)],
        });
    }
} 