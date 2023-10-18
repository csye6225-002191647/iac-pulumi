const pulumi = require("@pulumi/pulumi");
const aws = require("@pulumi/aws");
const config = new pulumi.Config();

// const selectedRegion = config.require("aws:region");
const cidrBlock = config.require("cidrBlock");
const devKeyName = config.require("keyName");
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
let instance;

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
      cidrBlock: `${address[0]}.${address[1]}.${index}.${address[3]}/24`, //ip address should not be hard coded here
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `Public-Subnet_0${index + 1}`,
      },
    });
    publicSubnets.push(publicSubnet);

    const privateSubnet = new aws.ec2.Subnet(`Private-Subnet_0${index + 1}`, {
      vpcId: vpc.id,
      availabilityZone: az,
      cidrBlock: `${address[0]}.${address[1]}.${index + 3}.${address[3]}/24`,
      tags: {
        Name: `Private-Subnet_0${index + 1}`,
      },
    });
    privateSubnets.push(privateSubnet);
  });

  // Create an Internet Gateway and attach it to the VPC
  const internetGateway = await new aws.ec2.InternetGateway(
    `${stackName}_Internet-Gateway`,
    {
      vpcId: vpc.id,
      tags: {
        Name: `${stackName}_Internet-Gateway`,
      },
    }
  );

  // Create public and private route tables
  const publicRouteTable = await new aws.ec2.RouteTable(
    `${stackName}_Public-Route-Table`,
    {
      vpcId: vpc.id,
      tags: {
        Name: `${stackName}_Public-Route-Table`,
      },
    }
  );

  const privateRouteTable = await new aws.ec2.RouteTable(
    `${stackName}_Private-Route-Table`,
    {
      vpcId: vpc.id,
      tags: {
        Name: `${stackName}_Private-Route-Table`,
      },
    }
  );

  // Create a route in the public route table to the Internet Gateway
  new aws.ec2.Route(`${stackName}_Public-Route`, {
    routeTableId: publicRouteTable.id,
    destinationCidrBlock: "0.0.0.0/0",
    gatewayId: internetGateway.id,
    tags: {
      Name: `${stackName}_Public-Route`,
    },
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
      }
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
      }
    );
  });

  // Create a security group allowing inbound access over port 80 and outbound
  // access to anywhere.
  const applicationSecurityGroup = await new aws.ec2.SecurityGroup(
    "appSecurityGroup",
    {
      vpcId: vpc.id,
      egress: [
        { fromPort: 0, toPort: 0, protocol: "-1", cidrBlocks: ["0.0.0.0/0"] },
      ],
      ingress: [
        {
          protocol: "tcp",
          fromPort: 22,
          toPort: 22,
          cidrBlocks: ["0.0.0.0/0"],
        },
        {
          protocol: "tcp",
          fromPort: 80,
          toPort: 80,
          cidrBlocks: ["0.0.0.0/0"],
        },
        {
          protocol: "tcp",
          fromPort: 443,
          toPort: 443,
          cidrBlocks: ["0.0.0.0/0"],
        },
        {
          protocol: "tcp",
          fromPort: 8080,
          toPort: 8080,
          cidrBlocks: ["0.0.0.0/0"],
        },
      ],
    }
  );

  // Find the latest AMI.
  const ami = await pulumi.output(
    aws.ec2.getAmi({
      owners: ["392319571849"],
      mostRecent: true,
    })
  );

  // Create and launch an Amazon Linux EC2 instance into the public subnet.
  instance = await new aws.ec2.Instance("instance", {
    ami: ami.id,
    instanceType: "t2.micro",
    subnetId: publicSubnets[0].id,
    vpcSecurityGroupIds: [applicationSecurityGroup.id],
    keyName: devKeyName,
    userData: `
        #!/bin/bash
        amazon-linux-extras install nginx1
        amazon-linux-extras enable nginx
        systemctl enable nginx
        systemctl start nginx
    `,
  });
}

main();
