const pulumi = require("@pulumi/pulumi");
const aws = require("@pulumi/aws");
const config = new pulumi.Config();

// const selectedRegion = config.require("aws:region");
const cidrBlock = config.require("cidrBlock"); 
const stackName = pulumi.getStack();

// Create a new VPC
const vpc = new aws.ec2.Vpc(`${stackName}_VPC`, {
    cidrBlock: cidrBlock,
    tags: {
        Name: `${stackName}_VPC`,
    },
});

async function main() {
    let availabilityZones = [];

    // Create a public and private subnet in each availability zone
    const publicSubnets = [];
    const privateSubnets = [];

    const azs = await aws.getAvailabilityZones({
        state: 'available',  // You can filter by availability zone state if needed
    });

    if (azs.names >= 3) {
        availabilityZones = azs.names.slice(0,3);
    } else {
        availabilityZones = azs.names
    }

    const ipAddress = cidrBlock.split("/")[0];
    const address = ipAddress.split('.');
    const concatIP = `${address[0]}.${address[1]}`

    availabilityZones.forEach((az, index) => {
        const publicSubnet = new aws.ec2.Subnet(`Public-Subnet_0${index+1}`, {
            vpcId: vpc.id,
            availabilityZone: az,
            cidrBlock: `${concatIP}.${index}.0/24`, //ip address should not be hard coded here 
            mapPublicIpOnLaunch: true,
            tags: {
                Name:`Public-Subnet_0${index+1}`,
            },
        });
        publicSubnets.push(publicSubnet);

        const privateSubnet = new aws.ec2.Subnet(`Private-Subnet_0${index+1}`, {
            vpcId: vpc.id,
            availabilityZone: az,
            cidrBlock: `${concatIP}.${index + 3}.0/24`,
            tags: {
                Name:`Private-Subnet_0${index+1}`,
            },
        });
        privateSubnets.push(privateSubnet);
    });

    // Create an Internet Gateway and attach it to the VPC
    const internetGateway = new aws.ec2.InternetGateway(`${stackName}_Internet-Gateway`, {
        vpcId: vpc.id,
        tags: {
            Name:`${stackName}_Internet-Gateway`,
        },
    });

    // Create public and private route tables
    const publicRouteTable = new aws.ec2.RouteTable(`${stackName}_Public-Route-Table`, {
        vpcId: vpc.id,
        tags: {
            Name:`${stackName}_Public-Route-Table`,
        },
    });

    const privateRouteTable = new aws.ec2.RouteTable(`${stackName}_Private-Route-Table`, {
        vpcId: vpc.id,
        tags: {
            Name:`${stackName}_Private-Route-Table`,
        },
    });

    // Create a route in the public route table to the Internet Gateway
    new aws.ec2.Route(`${stackName}_Public-Route`, {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: "0.0.0.0/0",
        gatewayId: internetGateway.id,
        tags: {
            Name:`${stackName}_Public-Route`,
        },
    });

    // Associate public and private subnets with their respective route tables
    publicSubnets.forEach((subnet, index) => {
        new aws.ec2.RouteTableAssociation(`${stackName}_publicRTAssociation_0${index+1}`, {
            subnetId: subnet.id,
            routeTableId: publicRouteTable.id,
            tags: {
                Name:`${stackName}_publicRTAssociation_0${index+1}`,
            },
        });
    });

    privateSubnets.forEach((subnet, index) => {
        new aws.ec2.RouteTableAssociation(`${stackName}_privateRTAssociation_0${index+1}`, {
            subnetId: subnet.id,
            routeTableId: privateRouteTable.id,
            tags: {
                Name:`${stackName}_privateRTAssociation_0${index+1}`,
            },
        });
    });
}

main();

// Export VPC ID for reference
exports.vpcId = vpc.id;
