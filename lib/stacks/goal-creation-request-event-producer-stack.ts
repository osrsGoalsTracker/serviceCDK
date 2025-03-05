import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import { Construct } from 'constructs';

interface GoalCreationRequestEventProducerStackProps extends cdk.StackProps {
    eventBus: events.EventBus;
}

export class GoalCreationRequestEventProducerStack extends cdk.Stack {
    public readonly goalCreationRequestEventProducerFunction: lambda.Function;

    constructor(scope: Construct, id: string, props: GoalCreationRequestEventProducerStackProps) {
        super(scope, id, props);

        const stage = this.node.tryGetContext('stage') || 'dev';
        const stackConfig = require('../../config.json').stacks.goalCreationRequestEventProducer;

        if (!stackConfig.lambda) {
            throw new Error('Lambda configuration missing for GoalCreationRequestEventProducer stack');
        }

        // Create Lambda function
        this.goalCreationRequestEventProducerFunction = new lambda.Function(this, 'GoalCreationRequestEventProducerHandler', {
            runtime: lambda.Runtime.JAVA_21,
            handler: stackConfig.lambda.handler,
            code: lambda.Code.fromAsset(stackConfig.lambda.jarPath),
            memorySize: 512,
            timeout: cdk.Duration.seconds(30),
            functionName: `${stackConfig.lambda.name}-${stage}`,
            environment: {
                EVENT_BUS_NAME: props.eventBus.eventBusName,
                STAGE: stage
            }
        });

        // Grant permissions to put events on the event bus
        props.eventBus.grantPutEventsTo(this.goalCreationRequestEventProducerFunction);
    }
} 