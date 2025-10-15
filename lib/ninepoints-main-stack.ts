import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as lambda from 'aws-cdk-lib/aws-lambda';

export class NinepointsMainStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    const lambdaVersionArn = 'arn:aws:lambda:us-east-1:115111881587:function:NinepointsEdgeCdkStack-RedirectLambda8E8905B7-kbt8b69CpitM:2';
    const acmArn = this.node.tryGetContext('acmCertificateArn');

    // S3バケット
    const rootBucket = new s3.Bucket(this, 'NinepointsRootBucket', {
      bucketName: 'ninepoints.jp',
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS_ONLY,
      publicReadAccess: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // S3ウェブサイトエンドポイントをCloudFrontオリジンとして使用
    const origin = new origins.HttpOrigin(rootBucket.bucketWebsiteDomainName, {
      protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
    });

    const lambdaVersion = lambda.Version.fromVersionArn(
      this,
      'RedirectLambdaVersion',
      lambdaVersionArn
    );

    // CloudFrontディストリビューション作成
    new cloudfront.Distribution(this, 'NinepointsDistribution', {
      defaultBehavior: {
        origin,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        edgeLambdas: [
          {
            functionVersion: lambdaVersion,
            eventType: cloudfront.LambdaEdgeEventType.VIEWER_REQUEST,
          },
        ]
      },
      certificate: acm.Certificate.fromCertificateArn(this, 'AcmCert', acmArn),
      domainNames: ['ninepoints.jp', 'www.ninepoints.jp'],
      defaultRootObject: 'index.html',
      comment: 'CloudFront Distribution for ninepoints.jp',
    });
  }
}
