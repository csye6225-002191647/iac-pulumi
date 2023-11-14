const pulumi = require("@pulumi/pulumi");
const aws = require("@pulumi/aws");
const { Ipv4 } = require("@pulumi/aws/alb");
const config = new pulumi.Config();

const cidrBlock = config.require("cidrBlock");
const keyName = config.require("keyName");
const subnetMask = config.require("subnetMask");
const ingressRules = config.getObject("ingressRules");
const dbIngressRules = config.getObject("dbIngressRules");
const lbIngressRules = config.getObject("lbIngressRules");
const instanceClass = config.require("instanceClass");
const engine = config.require("engine");
const allocatedStorage = config.require("allocatedStorage");
const engineVersion = config.require("engineVersion");
const dbName = config.require("dbName");
const dbInstanceIdentifier = config.require("dbInstanceIndentifier");
const dbInstanceUsername = config.require("dbInstanceUsername");
const dbParameterGroupFamily = config.require("dbParameterGroupFamily");
const amiOwnersString = config.require("amiOwners");
const instanceType = config.require("instanceType");
const ENVIRONMENT = config.require("ENVIRONMENT");
const port = config.require("port");
const dbInstancePassword = config.require("dbInstancePassword");
const domainName = config.require("domainName");
const stackName = pulumi.getStack();

// Create a new VPC
const vpc = new aws.ec2.Vpc(`${stackName}_VPC`, {
  cidrBlock: cidrBlock,
  tags: {
    Name: `${stackName}_VPC`,
  },
});

const publicSubnets = [];
const privateSubnets = [];

async function main() {
  let availabilityZones = [];

  // Create a public and private subnet in each availability zone
  const azs = await aws.getAvailabilityZones({
    state: "available", // You can filter by availability zone state if needed
  });

  if (azs.names.length >= 3) {
    availabilityZones = azs.names.slice(0, 3);
  } else {
    availabilityZones = azs.names;
  }

  const ipAddress = cidrBlock.split("/")[0];
  const address = ipAddress.split(".");

  availabilityZones.forEach((az, index) => {
    const publicSubnet = new aws.ec2.Subnet(
      `Public-Subnet_0${index + 1}`,
      {
        vpcId: vpc.id,
        availabilityZone: az,
        cidrBlock: `${address[0]}.${address[1]}.${index}.${address[3]}/${subnetMask}`, //ip address should not be hard coded here
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `Public-Subnet_0${index + 1}`,
        },
      },
      { dependsOn: [vpc] }
    );
    publicSubnets.push(publicSubnet);

    const privateSubnet = new aws.ec2.Subnet(
      `Private-Subnet_0${index + 1}`,
      {
        vpcId: vpc.id,
        availabilityZone: az,
        cidrBlock: `${address[0]}.${address[1]}.${index + 3}.${address[3]
          }/${subnetMask}`,
        tags: {
          Name: `Private-Subnet_0${index + 1}`,
        },
      },
      { dependsOn: [vpc] }
    );
    privateSubnets.push(privateSubnet);
  });

  // Create an Internet Gateway and attach it to the VPC
  const internetGateway = new aws.ec2.InternetGateway(
    `${stackName}_Internet-Gateway`,
    {
      vpcId: vpc.id,
      tags: {
        Name: `${stackName}_Internet-Gateway`,
      },
    },
    { dependsOn: [vpc] }
  );

  // Create public and private route tables
  const publicRouteTable = new aws.ec2.RouteTable(
    `${stackName}_Public-Route-Table`,
    {
      vpcId: vpc.id,
      tags: {
        Name: `${stackName}_Public-Route-Table`,
      },
    },
    { dependsOn: [vpc] }
  );

  const privateRouteTable = new aws.ec2.RouteTable(
    `${stackName}_Private-Route-Table`,
    {
      vpcId: vpc.id,
      tags: {
        Name: `${stackName}_Private-Route-Table`,
      },
    },
    { dependsOn: [vpc] }
  );

  // Create a route in the public route table to the Internet Gateway
  new aws.ec2.Route(
    `${stackName}_Public-Route`,
    {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: internetGateway.id,
      tags: {
        Name: `${stackName}_Public-Route`,
      },
    },
    {
      dependsOn: [publicRouteTable, internetGateway],
    }
  );

  // Associate public and private subnets with their respective route tables
  publicSubnets.forEach((subnet, index) => {
    new aws.ec2.RouteTableAssociation(
      `${stackName}_publicRTAssociation_0${index + 1}`,
      {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
        tags: {
          Name: `${stackName}_publicRTAssociation_0${index + 1}`,
        },
      },
      { dependsOn: [publicRouteTable] }
    );
  });

  privateSubnets.forEach((subnet, index) => {
    new aws.ec2.RouteTableAssociation(
      `${stackName}_privateRTAssociation_0${index + 1}`,
      {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
        tags: {
          Name: `${stackName}_privateRTAssociation_0${index + 1}`,
        },
      },
      { dependsOn: [privateRouteTable] }
    );
  });

  const privateSubnetsGroup = new aws.rds.SubnetGroup("private_subnets_group", {
    subnetIds: privateSubnets.filter((subnet) => subnet.id),
    tags: {
      Name: "Private Subnets Group",
    },
  });

  //LoadBalancer security group
  const loadBalancerSecurityGroup = new aws.ec2.SecurityGroup(
    "loadBalancerSecurityGroup",
    {
      vpcId: vpc.id,
      egress: [
        { fromPort: 0, toPort: 0, protocol: "-1", cidrBlocks: ["0.0.0.0/0"] },
      ],
      ingress: lbIngressRules,
    },
    { dependsOn: [vpc] }
  );
  //applicationSecurityGroup
  const applicationSecurityGroup = new aws.ec2.SecurityGroup(
    "appSecurityGroup",
    {
      vpcId: vpc.id,
      egress: [
        { fromPort: 0, toPort: 0, protocol: "-1", cidrBlocks: ["0.0.0.0/0"] },
      ],
       ingress: ingressRules
      // ingress:
      //   [{
      //     protocol: "tcp",
      //     fromPort: 22,
      //     toPort: 22,
      //     cidrBlocks:
      //       ["0.0.0.0/0"],
      //     securityGroups: [loadBalancerSecurityGroup.id]
      //   },
      //   {
      //     protocol: "tcp",
      //     fromPort: 8080,
      //     toPort: 8080,
      //     cidrBlocks:
      //       ["0.0.0.0/0"],
      //     securityGroups: [loadBalancerSecurityGroup.id]
      //   }]
    },
    { dependsOn: [vpc, loadBalancerSecurityGroup] }
  );

  // Create a DB security group
  const databaseSecurityGroup = new aws.ec2.SecurityGroup(
    "databaseSecurityGroup",
    {
      description: "DB Security Group for RDS",
      vpcId: vpc.id,
      egress: [
        { fromPort: 0, toPort: 0, protocol: "-1", cidrBlocks: ["0.0.0.0/0"] },
      ],
      ingress: dbIngressRules,
      source_security_group_id: applicationSecurityGroup.id,
    },
    { dependsOn: [vpc, applicationSecurityGroup] }
  );

  // Step 2: Create RDS Parameter Group
  const dbParameterGroup = new aws.rds.ParameterGroup("db-parameter-group", {
    family: dbParameterGroupFamily,
    parameters: [
      {
        name: "client_encoding",
        value: "UTF8",
      },
    ],
  });

  // Step 3: Create RDS Instance
  // If you want to specify "Multi-AZ deployment: No" when creating your RDS instance in the Pulumi code,
  // you can simply omit the availabilityZone and backupRetentionPeriod properties.
  // creating the RDS instance with "Multi-AZ deployment: No"
  const dbInstance = new aws.rds.Instance(
    "db-instance",
    {
      instanceClass: instanceClass, // Use the cheapest one
      allocatedStorage: allocatedStorage,
      dbSubnetGroupName: privateSubnetsGroup.name,
      engine: engine, // Use "postgres" for PostgreSQL
      engineVersion: engineVersion,
      // name: "postgres", // DB instance Identifier
      dbName: dbName,
      identifier: dbInstanceIdentifier,
      username: dbInstanceUsername,
      password: dbInstancePassword,
      skipFinalSnapshot: true,
      publiclyAccessible: false,
      vpcSecurityGroupIds: [databaseSecurityGroup.id],
      parameterGroupName: dbParameterGroup.name,
      userDataReplaceOnChange: true,
    },
    {
      dependsOn: [privateSubnetsGroup, databaseSecurityGroup, dbParameterGroup],
    }
  );

  // Step 4: User Data
  const userDataScript = pulumi
    .all([
      dbInstance.address,
      dbInstance.username,
      dbInstance.password,
      dbInstance.dbName,
      dbInstance.port,
    ])
    .apply(
      (values) =>
        `#!/bin/bash
    sudo -u csye6225 bash
    cd /opt/csye6225/webapp

    sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config \
    -m ec2 \
    -c file:/opt/csye6225/webapp/app/config/cloudwatch.config.json \
    -s

    sudo systemctl enable amazon-cloudwatch-agent
    sudo systemctl start amazon-cloudwatch-agent

    sudo rm -rf .env
    sudo touch .env
    sudo echo "HOSTNAME=${values[0]}">> /opt/csye6225/webapp/.env
    sudo echo "DBUSER=${values[1]}">> /opt/csye6225/webapp/.env
    sudo echo "DBPASSWORD=${values[2]}">> /opt/csye6225/webapp/.env
    sudo echo "DATABASE=${values[3]}">> /opt/csye6225/webapp/.env
    sudo echo "DBPORT=${values[4]}">> /opt/csye6225/webapp/.env
    sudo echo "ENVIRONMENT=${ENVIRONMENT}">> /opt/csye6225/webapp/.env
    sudo echo "PORT=${port}">> /opt/csye6225/webapp/.env
    source /opt/csye6225/webapp/.env
    `
    );

  // Find the latest AMI.
  const amiOwnersList = amiOwnersString.split().map((owner) => owner.trim());
  const ami = pulumi.output(
    aws.ec2.getAmi({
      owners: amiOwnersList,
      mostRecent: true,
    })
  );

  // Create an IAM role for use with CloudWatch Agent
  const cloudWatchAgentRole = new aws.iam.Role("CloudWatchAgentRole", {
    assumeRolePolicy: JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Action: "sts:AssumeRole",
          Effect: "Allow",
          Principal: {
            Service: "ec2.amazonaws.com",
          },
        },
      ],
    }),
  });

  // Attach the CloudWatchAgentServerPolicy to the IAM role
  const cloudWatchAgentPolicyAttachment = new aws.iam.PolicyAttachment(
    "CloudWatchAgentPolicyAttachment",
    {
      policyArn: "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
      roles: [cloudWatchAgentRole.name],
    },
    { dependsOn: [cloudWatchAgentRole] }
  );

  // Create an instance profile and attach the IAM role.
  const instanceProfile = new aws.iam.InstanceProfile("myInstanceProfile", {
    role: cloudWatchAgentRole.name,
  },
    { dependsOn: [cloudWatchAgentRole] }
  );

  // Create Launch Template
  const launchTemplate = new aws.ec2.LaunchTemplate("webAppLaunchTemplate", {
    imageId: ami.id,
    instanceType: instanceType,
    //subnets: publicSubnets.map((subnet) => subnet.id), //check with the instruction and grading guidelines
    keyName: keyName,
    userData: userDataScript.apply(script => Buffer.from(script).toString("base64")),
    iamInstanceProfile: {
      name: instanceProfile.name,
    },
    networkInterfaces: [{
      associatePublicIpAddress: true,
      securityGroups: [applicationSecurityGroup.id],
      deleteOnTermination: true
    }],
  },
    { dependsOn: [applicationSecurityGroup, instanceProfile] }
  );

  const targetGroup = new aws.lb.TargetGroup(`${stackName}-target-group`, {
    port: port,
    protocol: "HTTP",
    targetType: "instance",
    vpcId: vpc.id,
    ipAddressType: "ipv4",
    associatePublicIpAddress: true,
    healthCheck: {
      path: "/healthz",
      port: port,
    }
  });

  // Create Auto Scaling Group
  const autoScalingGroup = new aws.autoscaling.Group("webAppAutoScalingGroup", {
    desiredCapacity: 1,
    maxSize: 3,
    minSize: 1,
    vpcZoneIdentifiers: [publicSubnets[0].id], // specify your subnet IDs
    launchTemplate: {
      id: launchTemplate.id,
      version: "$Latest",
    },
    tags: [
      {
        key: "Name",
        propagateAtLaunch: true,
        value: "instance",
      },
    ],
    cooldown: 60,
    targetGroupArns: [targetGroup.arn],
  },
    { dependsOn: [publicSubnets, targetGroup, launchTemplate] });

  const alb = new aws.lb.LoadBalancer(`${stackName}-alb`, {
    internal: false, // Set to true for internal ALB
    ipAddressType: "ipv4",
    loadBalancerType: "application",
    securityGroups: [loadBalancerSecurityGroup.id],
    subnets: publicSubnets.map((subnet) => subnet.id),
    enableDeletionProtection: false,
  },
    { dependsOn: [loadBalancerSecurityGroup, publicSubnets] });

  const albListener = new aws.lb.Listener(`${stackName}-alb-listener`, {
    loadBalancerArn: alb.arn,
    port: 80,
    protocol: "HTTP",
    defaultActions: [
      {
        type: "forward",
        targetGroupArn: targetGroup.arn,
      },
    ],
  },
  { dependsOn: [alb, targetGroup] });

  const hostedZone = await aws.route53.getZone({ name: domainName });

  // Create an A record pointing to the ALB DNS name
  const aRecord = new aws.route53.Record(`${domainName}`, {
    zoneId: hostedZone.zoneId,
    name: domainName,
    type: "A",
    aliases: [
      {
        evaluateTargetHealth: true,
        name: alb.dnsName,
        zoneId: alb.zoneId,
      },
    ],
  },
    { dependsOn: [alb] });

  const scaleUpPolicy = new aws.autoscaling.Policy(
    "webAppScaleUpPolicy",
    {
      scalingAdjustment: 1,
      adjustmentType: "ChangeInCapacity",
      cooldown: 60,
      autoscalingGroupName: autoScalingGroup.name,
    },
    { dependsOn: [autoScalingGroup] }
  );

  const scaleDownPolicy = new aws.autoscaling.Policy(
    "webAppScaleDownPolicy",
    {
      scalingAdjustment: -1,
      adjustmentType: "ChangeInCapacity",
      cooldown: 60,
      autoscalingGroupName: autoScalingGroup.name,
    },
    { dependsOn: [autoScalingGroup] }
  );

  const scaleUpAlarm = new aws.cloudwatch.MetricAlarm("scaleUpAlarm", {
    comparisonOperator: "GreaterThanThreshold",
    evaluationPeriods: 2,
    metricName: "CPUUtilization",
    namespace: "AWS/EC2",
    statistic: "Average",
    period: 300,
    threshold: 5,
    alarmActions: [scaleUpPolicy.arn],
  }, { dependsOn: [scaleUpPolicy] });

  const scaleDownAlarm = new aws.cloudwatch.MetricAlarm("scaleDownAlarm", {
    comparisonOperator: "LessThanThreshold",
    evaluationPeriods: 2,
    metricName: "CPUUtilization",
    namespace: "AWS/EC2",
    statistic: "Average",
    period: 300,
    threshold: 3,
    alarmActions: [scaleDownPolicy.arn],
  }, { dependsOn: [scaleDownPolicy] });
}

main();
