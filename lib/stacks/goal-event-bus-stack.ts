import * as cdk from 'aws-cdk-lib';
import * as events from 'aws-cdk-lib/aws-events';
import { Construct } from 'constructs';

export class GoalEventBusStack extends cdk.Stack {
    public readonly eventBus: events.EventBus;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const stage = this.node.tryGetContext('stage') || 'dev';

        // Create the EventBus
        this.eventBus = new events.EventBus(this, 'GoalEventBus', {
            eventBusName: `goal-event-bus-${stage}`,
        });
    }
} 