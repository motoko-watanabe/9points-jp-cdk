import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';

export class NinepointsEdgeStack extends cdk.Stack {
    public readonly redirectLambdaVersionArn: cdk.CfnOutput;
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // Lambda@Edge用のIAMロール
        const lambdaRole = new iam.Role(this, 'LambdaEdgeRole', {
            assumedBy: new iam.CompositePrincipal(
                new iam.ServicePrincipal('lambda.amazonaws.com'),
                new iam.ServicePrincipal('edgelambda.amazonaws.com'),
            ),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
            ],
        });
        // CloudFront が Lambda を取得できる権限を追加
        lambdaRole.addToPolicy(new iam.PolicyStatement({
            actions: ['lambda:GetFunction'],
            resources: ['*'],
        }));

        // Lambda@Edge関数
        const redirectLambda = new lambda.Function(this, 'RedirectLambda', {
            //functionName: 'ninepoints-hp-www-to-root-redirect',
            code: lambda.Code.fromInline(`
        'use strict';
        exports.handler = async (event) => {
            const request = event.Records[0].cf.request;
            const host = request.headers.host[0].value;
            if (host === 'www.ninepoints.jp') {
                return {
                    status: '301',
                    statusDescription: 'Moved Permanently',
                    headers: {
                        'location': [{
                            key: 'Location',
                            value: 'https://ninepoints.jp' + request.uri
                        }],
                    },
                };
            }
            return request;
        };
      `),
            handler: 'index.handler',
            runtime: lambda.Runtime.NODEJS_22_X,
            role: lambdaRole,
        });

        // バージョンを発行
        const redirectLambdaVersion = redirectLambda.currentVersion;

    }
}
