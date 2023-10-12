const pulumi = require("@pulumi/pulumi");
const aws = require("@pulumi/aws");

const config = new pulumi.Config();
const stackName = pulumi.getStack();
const cidrBlock = config.require("cidrBlock");
 
const vpc = new aws.ec2.Vpc(`${stackName}_VPC`, {
    cidrBlock: cidrBlock,
    tags: {
      Name: `${stackName}_VPC`,
    },
});
  

async function createSubnets(vpc, stackName, cidrBlock) {
  const availabilityZones = await aws.getAvailabilityZones({ state: 'available' });
  const publicSubnets = [];
  const privateSubnets = [];

  for (let index = 0; index < 3; index++) {
    const az = availabilityZones.names[index];
    const ipAddress = cidrBlock.split("/")[0];
    const address = ipAddress.split('.');
    const concatIP = `${address[0]}.${address[1]}`;

    const publicSubnet = new aws.ec2.Subnet(`Public-Subnet_0${index + 1}`, {
      vpcId: vpc.id,
      availabilityZone: az,
      cidrBlock: `${concatIP}.${index}.0/24`,
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `Public-Subnet_0${index + 1}`,
      },
    });
    publicSubnets.push(publicSubnet);

    const privateSubnet = new aws.ec2.Subnet(`Private-Subnet_0${index + 1}`, {
      vpcId: vpc.id,
      availabilityZone: az,
      cidrBlock: `${concatIP}.${index + 3}.0/24`,
      tags: {
        Name: `Private-Subnet_0${index + 1}`,
      },
    });
    privateSubnets.push(privateSubnet);
  }

  return { publicSubnets, privateSubnets };
}

async function createInternetGateway(stackName, vpc) {
  const internetGateway = new aws.ec2.InternetGateway(`${stackName}_Internet-Gateway`, {
    vpcId: vpc.id,
    tags: {
      Name: `${stackName}_Internet-Gateway`,
    },
  });
  return internetGateway;
}

async function createRouteTables(stackName, vpc) {
  const publicRouteTable = new aws.ec2.RouteTable(`${stackName}_Public-Route-Table`, {
    vpcId: vpc.id,
    tags: {
      Name: `${stackName}_Public-Route-Table`,
    },
  });

  const privateRouteTable = new aws.ec2.RouteTable(`${stackName}_Private-Route-Table`, {
    vpcId: vpc.id,
    tags: {
      Name: `${stackName}_Private-Route-Table`,
    },
  });

  return { publicRouteTable, privateRouteTable };
}

async function createRouteToInternet(stackName, publicRouteTable, internetGateway) {
  new aws.ec2.Route(`${stackName}_Public-Route`, {
    routeTableId: publicRouteTable.id,
    destinationCidrBlock: "0.0.0.0/0",
    gatewayId: internetGateway.id,
    tags: {
      Name: `${stackName}_Public-Route`,
    },
  });
}

async function associateSubnetsWithRouteTables(stackName, publicSubnets, privateSubnets, publicRouteTable, privateRouteTable) {
  publicSubnets.forEach((subnet, index) => {
    new aws.ec2.RouteTableAssociation(`${stackName}_publicRTAssociation_0${index + 1}`, {
      subnetId: subnet.id,
      routeTableId: publicRouteTable.id,
      tags: {
        Name: `${stackName}_publicRTAssociation_0${index + 1}`,
      },
    });
  });

  privateSubnets.forEach((subnet, index) => {
    new aws.ec2.RouteTableAssociation(`${stackName}_privateRTAssociation_0${index + 1}`, {
      subnetId: subnet.id,
      routeTableId: privateRouteTable.id,
      tags: {
        Name: `${stackName}_privateRTAssociation_0${index + 1}`,
      },
    });
  });
}

async function main() {
  const { publicSubnets, privateSubnets } = await createSubnets(vpc, stackName, cidrBlock);
  const internetGateway = await createInternetGateway(stackName, vpc);
  const { publicRouteTable, privateRouteTable } = await createRouteTables(stackName, vpc);

  createRouteToInternet(stackName, publicRouteTable, internetGateway);
  associateSubnetsWithRouteTables(stackName, publicSubnets, privateSubnets, publicRouteTable, privateRouteTable);
}

main();

exports.vpcId = vpc.id;
