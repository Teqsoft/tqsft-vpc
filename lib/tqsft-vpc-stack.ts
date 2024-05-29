import { Construct } from 'constructs';
import { Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib/core';
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
    })

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
    })

    new StringParameter(this, 'TqsftStackVpcId', {
      parameterName: 'TqsftStack-VpcId',
      stringValue: myVpc.vpcId
    });

    new StringParameter(this, 'TqsftStackFsSgId', {
      parameterName: 'TqsftStack-FsSgId',
      stringValue: efsSG.securityGroupId
    })

    new StringParameter(this, 'TqsftStackFsId', {
      parameterName: 'TqsftStack-FsId',
      stringValue: efs.fileSystemId
    })
  }
}
