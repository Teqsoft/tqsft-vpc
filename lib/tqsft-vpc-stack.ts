import { Construct } from 'constructs';
import { Stack, StackProps, RemovalPolicy, CfnOutput } from 'aws-cdk-lib/core';
import { Vpc, SubnetType, SecurityGroup, IpAddresses} from 'aws-cdk-lib/aws-ec2';
import { StringParameter } from 'aws-cdk-lib/aws-ssm'
import { FileSystem } from 'aws-cdk-lib/aws-efs'
import { Ipv6Vpc } from './ipv6-vpc'

export class TqsftVpcStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    var vpcCidr = (process.env.VPC_CIDR) ? process.env.VPC_CIDR : '10.0.10.0/24';

    const myVpc = new Ipv6Vpc(this, 'VPC', {
      ipAddresses: IpAddresses.cidr(vpcCidr),
      enableDnsHostnames: true,
      enableDnsSupport: true,
      maxAzs: 2,
      subnetConfiguration: [
        {
          name: 'PublicSubnet',
          cidrMask: 26,
          subnetType: SubnetType.PUBLIC
        },{
          name: 'PrivateSubnet',
          cidrMask: 26,
          subnetType: SubnetType.PRIVATE_ISOLATED
        }
      ],
      vpcName: 'Tqsft-Vpc',
    });

    const efsSG = new SecurityGroup(this, "EFS-SG", {
      vpc: myVpc,
      securityGroupName: "EFSSecurityGroup",
      description: "Shared Drive for ECS",
      allowAllOutbound: true
    });

    const efs = new FileSystem(this, "CodeServerFS", {
      vpc: myVpc,
      fileSystemName: "ECSClusterSharedEFS",
      securityGroup: efsSG,
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE_ISOLATED
      },
      removalPolicy: RemovalPolicy.DESTROY
    });

    new StringParameter(this, 'TqsftStackVpcId', {
      parameterName: 'TqsftStack-VpcId',
      stringValue: myVpc.vpcId
    });

    new StringParameter(this, 'TqsftStackFsSgId', {
      parameterName: 'TqsftStack-FsSgId',
      stringValue: efsSG.securityGroupId
    });

    new StringParameter(this, 'TqsftStackFsId', {
      parameterName: 'TqsftStack-FsId',
      stringValue: efs.fileSystemId
    });

    new CfnOutput(this, 'TqsftStackVpcIdOutput', {
      exportName: 'Tqsft-VpcId',
      value: myVpc.vpcId
    });

    new CfnOutput(this, 'TqsftStackFsSgIdOutput', {
      exportName: 'Tqsft-FsSgId',
      value: efsSG.securityGroupId
    });

    new CfnOutput(this, 'TqsftStackFsIdOutput', {
      exportName: 'Tqsft-FsId',
      value: efs.fileSystemId
    });

    new CfnOutput(this, 'TqsftStackVpcCidrOutput', {
      exportName: 'Tqsft-VpcCidr',
      value: vpcCidr
    });

    new CfnOutput(this, 'TqsftStackIsolatedRouteTablesOutput', {
      exportName: 'Tqsft-IsolatedRouteTables',
      value: myVpc.isolatedRouteTablesId
    });

    new CfnOutput(this, 'TqsftStackPublicRouteTablesOutput', {
      exportName: 'Tqsft-PublicRouteTables',
      value: myVpc.publicRouteTablesId
    });

  }
}
