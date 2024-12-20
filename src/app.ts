import * as cdk from 'aws-cdk-lib';
import { PlayerStack } from './stacks/player-stack';

const app = new cdk.App();
const stage = app.node.tryGetContext('stage');

if (!stage) {
    throw new Error('Please provide a stage using --context stage=<stage>');
}

new PlayerStack(app, `PlayerStack-${stage}`, {
    description: `OSRS Goals Player service stack - ${stage}`,
    tags: {
        Stage: stage
    }
});

app.synth(); 