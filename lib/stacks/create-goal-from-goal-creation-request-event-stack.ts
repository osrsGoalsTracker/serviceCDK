import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

interface CreateGoalFromGoalCreationRequestEventStackProps extends cdk.StackProps {
    eventBus: events.EventBus;
    goalTrackerTable: dynamodb.Table;
}

export class CreateGoalFromGoalCreationRequestEventStack extends cdk.Stack {
    public readonly createGoalLambda: lambda.Function;

    constructor(scope: Construct, id: string, props: CreateGoalFromGoalCreationRequestEventStackProps) {
        super(scope, id, props);

        const stage = this.node.tryGetContext('stage') || 'dev';

        // Create the Lambda function
        this.createGoalLambda = new lambda.Function(this, 'CreateGoalFromEventLambda', {
            functionName: `CreateGoalFromGoalCreationRequestEvent-${stage}`,
            runtime: lambda.Runtime.JAVA_21,
            handler: 'com.osrsGoalTracker.goal.handler.CreateGoalFromGoalCreationRequestEventHandler::handleRequest',
            code: lambda.Code.fromAsset('../service/build/libs/createGoalFromGoalCreationRequestEvent-lambda-1.0-SNAPSHOT.jar'),
            timeout: cdk.Duration.seconds(30),
            memorySize: 512,
            environment: {
                STAGE: stage,
                GOAL_TRACKER_TABLE_NAME: props.goalTrackerTable.tableName,
            },
        });

        // Grant DynamoDB permissions
        props.goalTrackerTable.grantWriteData(this.createGoalLambda);

        // Add the Lambda as a target for the GoalCreationEvent rule
        const rule = new events.Rule(this, 'GoalCreationEventToLambdaRule', {
            eventBus: props.eventBus,
            ruleName: `goal-creation-to-lambda-${stage}`,
            description: 'Forward goal creation events to create goal lambda',
            eventPattern: {
                detailType: ['GoalCreationEvent'],
            },
            targets: [new targets.LambdaFunction(this.createGoalLambda)],
        });
    }
} 