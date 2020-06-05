#!/usr/bin/env node
import { App } from '@aws-cdk/core';
import 'source-map-support/register';
import { MyApplication } from '../lib/my-application';
import { MyPipelineStack } from '../lib/my-pipeline-stack';

const app = new App();

new MyApplication({
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});

const pipeline = new MyPipelineStack(app, 'PipelineStack', {
  env: { account: '226122282356', region: 'eu-west-1' },
});

pipeline.addApplication('Beta', new MyApplication({
  env: { account: '203703808712', region: 'eu-west-1' },
}));

pipeline.addApplication('Gamma', new MyApplication({
  env: { account: '153824960622', region: 'us-east-2' },
}));

app.synth();