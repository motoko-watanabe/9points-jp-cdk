#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { App } from 'aws-cdk-lib'
import { NinepointsStack } from '../lib/ninepoints-cdk-stack';
import { NinepointsEdgeStack } from '../lib/ninepoints-edge-stack';
import { NinepointsMainStack } from '../lib/ninepoints-main-stack';

const pjPrefix = "NinepointsCdk"
const app = new App({
  context: {
    acmCertificateArn: "arn:aws:acm:us-east-1:115111881587:certificate/4019d41c-dbdd-482a-94c8-c1d799e147b3",
    '@aws-cdk/core:crossRegionReferences': true
  }
})

// ----------------------- Load context variables ------------------------------
// This context need to be specified in args
const argContext = 'environment'
const envKey = app.node.tryGetContext(argContext)
if (envKey == undefined)
  throw new Error(`Please specify environment with context option. ex) cdk deploy -c ${argContext}=dev`)

/*new NinepointsStack(app, 'NinepointsCdkStack', {
  env: { region: 'us-east-1' } // Lambda@Edge 用に us-east-1 指定
});*/

const edgeStack = new NinepointsEdgeStack(app, 'NinepointsEdgeCdkStack', {
  env: { region: 'us-east-1' } // Lambda@Edge 用に us-east-1 指定
});

new NinepointsMainStack(app, 'NinepointsMainCdkStack', {
  env: { region: 'ap-northeast-1' }, // CloudFront 用に ap-northeast-1 指定
});