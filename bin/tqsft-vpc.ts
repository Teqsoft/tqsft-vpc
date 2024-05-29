#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib/core';
import { TqsftVpcStack } from '../lib/tqsft-vpc-stack';

const app = new cdk.App();
new TqsftVpcStack(app, 'TqsftVpcStack', {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: process.env.CDK_DEFAULT_REGION 
  }
});
