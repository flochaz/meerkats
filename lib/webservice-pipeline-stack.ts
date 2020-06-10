import codepipeline = require('@aws-cdk/aws-codepipeline');
import codecommit = require('@aws-cdk/aws-codecommit');
import codepipeline_actions = require('@aws-cdk/aws-codepipeline-actions');
import { Construct, SecretValue, Stack, StackProps } from '@aws-cdk/core';
import { AppDeliveryPipeline, CdkBuilds, Validation } from "./app-delivery";
import { WebServiceApp } from './web-service-app';

/**
 * The stack that defines the application pipeline
 */
export class WebServicePipelineStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    const repo = new codecommit.Repository(this, 'Repository' ,{
      repositoryName: 'cicdTemplate',
      description: 'A dummy app with cross region/account pipeline', // optional property
  });

    const pipeline = new AppDeliveryPipeline(this, 'Pipeline', {
      // The pipeline name
      pipelineName: 'WebServicePipeline',

      // Where the source can be found
      source: new codepipeline_actions.CodeCommitSourceAction({
        actionName: 'CodeCommit',
        output: new codepipeline.Artifact(),
        repository:  repo,
        trigger: codepipeline_actions.CodeCommitTrigger.POLL
      }),

      // How it will be built
      build: CdkBuilds.standardYarnBuild(),
    });

    // This is where we add copies of the application
    // ...
    const betaStage = pipeline.addApplicationStage('Beta', new WebServiceApp({
      outdir: 'cdk.out/beta',
      env: { account: '203703808712', region: 'us-east-1' }
    }));

    betaStage.addValidations(Validation.shellScript({
      name: 'TestEndpoint',
      useOutputs: {
        // From the stack 'WebService', get the output 'Url' and make it available in
        // the shell script as '$ENDPOINT_URL'
        ENDPOINT_URL: {
          outputs: betaStage.stackOutputs('WebService'),
          outputName: 'Url',
        },
      },
      commands: [
        // Use 'curl' to GET the given URL and fail it it returns an error
        'curl -Ssf $ENDPOINT_URL',
      ],
    }));

    pipeline.addApplicationStage('Gamma', new WebServiceApp({
      outdir: 'cdk.out/gamma',
      env: { account: '153824960622', region: 'us-east-2' }
    }));
  }
}