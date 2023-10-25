const pulumi = require("@pulumi/pulumi");
const aws = require("@pulumi/aws");
const config = new pulumi.Config();

const cidrBlock = config.require("cidrBlock");
const keyName = config.require("keyName");
const subnetMask = config.require("subnetMask");
const ingressRules = config.getObject("ingressRules");
const dbIngressRules = config.getObject("dbIngressRules");
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
    const publicSubnet = new aws.ec2.Subnet(`Public-Subnet_0${index + 1}`, {
      vpcId: vpc.id,
      availabilityZone: az,
      cidrBlock: `${address[0]}.${address[1]}.${index}.${address[3]}/${subnetMask}`, //ip address should not be hard coded here
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `Public-Subnet_0${index + 1}`,
      },
    },
    {dependsOn: [vpc]});
    publicSubnets.push(publicSubnet);

    const privateSubnet = new aws.ec2.Subnet(`Private-Subnet_0${index + 1}`, {
      vpcId: vpc.id,
      availabilityZone: az,
      cidrBlock: `${address[0]}.${address[1]}.${index + 3}.${address[3]}/${subnetMask}`,
      tags: {
        Name: `Private-Subnet_0${index + 1}`,
      },
    },
    {dependsOn: [vpc]});
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
    {dependsOn: [vpc]}
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
    {dependsOn: [vpc]}
  );

  const privateRouteTable = new aws.ec2.RouteTable(
    `${stackName}_Private-Route-Table`,
    {
      vpcId: vpc.id,
      tags: {
        Name: `${stackName}_Private-Route-Table`,
      },
    },
    {dependsOn: [vpc]}
  );

  // Create a route in the public route table to the Internet Gateway
  new aws.ec2.Route(`${stackName}_Public-Route`, {
    routeTableId: publicRouteTable.id,
    destinationCidrBlock: "0.0.0.0/0",
    gatewayId: internetGateway.id,
    tags: {
      Name: `${stackName}_Public-Route`,
    },
  }, {
    dependsOn: [publicRouteTable, internetGateway]
  });

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
      {dependsOn:[publicRouteTable]}
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
      {dependsOn:[privateRouteTable]}
    );
  });

  const privateSubnetsGroup = new aws.rds.SubnetGroup("private_subnets_group", {
    subnetIds: privateSubnets.filter((subnet) => subnet.id),
    tags: {
        Name: "Private Subnets Group",
    },
});

  // Create a security group allowing inbound access over port 80 and outbound
  // access to anywhere.
  const applicationSecurityGroup = new aws.ec2.SecurityGroup(
    "appSecurityGroup",
    {
      vpcId: vpc.id,
      egress: [
        { fromPort: 0, toPort: 0, protocol: "-1", cidrBlocks: ["0.0.0.0/0"] },
      ],
      ingress: ingressRules,
    },
    {dependsOn: [vpc]}
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
      source_security_group_id: applicationSecurityGroup.id
    },
    {dependsOn: [vpc, applicationSecurityGroup ]}
  )

  // Step 2: Create RDS Parameter Group
  const dbParameterGroup = new aws.rds.ParameterGroup("db-parameter-group", {
    family: "postgres12",
    parameters: [
      {
        name: "client_encoding",
        value: "UTF8"
      }
    ],
  });

  // Step 3: Create RDS Instance
  // If you want to specify "Multi-AZ deployment: No" when creating your RDS instance in the Pulumi code,
  // you can simply omit the availabilityZone and backupRetentionPeriod properties. 
  // creating the RDS instance with "Multi-AZ deployment: No"
  const dbInstance = new aws.rds.Instance("db-instance", {
    instanceClass: "db.t2.micro", // Use the cheapest one
    allocatedStorage: 20,
    // backupRetentionPeriod: 7,
    dbSubnetGroupName: privateSubnetsGroup.name,
    engine: "postgres", // Use "postgres" for PostgreSQL
    engineVersion: 12,
    // name: "postgres", // DB instance Identifier
    dbName: "csye6225",
    identifier: 'csye6225',
    username: "postgres",
    password: "postgres",
    skipFinalSnapshot: true,
    publiclyAccessible: false,
    vpcSecurityGroupIds: [databaseSecurityGroup.id],
    parameterGroupName: dbParameterGroup.name,
    userDataReplaceOnChange: true
  },
  {dependsOn: [privateSubnetsGroup, databaseSecurityGroup, dbParameterGroup]});

  // Step 4: User Data
  const userDataScript = pulumi.all([dbInstance.address, dbInstance.username, dbInstance.password]).apply(
    values => 
    `#!/bin/bash
    cd /opt/csye6225/webapp
    sudo rm -rf .env
    sudo touch .env
    sudo echo "HOSTNAME=${values[0]}">> /opt/csye6225/webapp.env
    sudo echo "DBUSER=${values[1]}">> /opt/csye6225/webapp.env
    sudo echo "DBPASSWORD=${values[2]}">> /opt/csye6225/webapp.env
    sudo echo "DBPORT=5432">> /opt/csye6225/webapp.env
    sudo echo "DATABASE=postgres">> /opt/csye6225/webapp.env
    sudo echo "ENVIRONMENT=DEV">> /opt/csye6225/webapp.env
    sudo echo "PORT=8080">> /opt/csye6225/webapp.env
    source /opt/csye6225/webapp/.env
    `
);

  // Find the latest AMI.
  const ami = pulumi.output(
    aws.ec2.getAmi({
      owners: ["392319571849"],
      mostRecent: true,
    })
  );

  // Create and launch an Amazon Linux EC2 instance into the public subnet.
  const instance = new aws.ec2.Instance("instance", {
    ami: ami.id,
    instanceType: "t2.micro",
    subnetId: publicSubnets[0].id,
    vpcSecurityGroupIds: [applicationSecurityGroup.id],
    keyName: keyName,
    userData: userDataScript
  },
  {dependsOn: [applicationSecurityGroup]});
}

main();