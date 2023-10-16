const pulumi = require("@pulumi/pulumi");
const aws = require("@pulumi/aws");

// Create a VPC.
const vpc = new aws.ec2.Vpc("vpc", {
    cidrBlock: "10.0.0.0/16",
});

// Create an an internet gateway.
const gateway = new aws.ec2.InternetGateway("gateway", {
    vpcId: vpc.id,
});

// Create a subnet that automatically assigns new instances a public IP address.
const subnet = new aws.ec2.Subnet("subnet", {
    vpcId: vpc.id,
    cidrBlock: "10.0.1.0/24",
    mapPublicIpOnLaunch: true,
});

// Create a route table.
const routes = new aws.ec2.RouteTable("routes", {
    vpcId: vpc.id,
    routes: [
        {
            cidrBlock: "0.0.0.0/0",
            gatewayId: gateway.id,
        },
    ],
});

// Associate the route table with the public subnet.
const routeTableAssociation = new aws.ec2.RouteTableAssociation("route-table-association", {
    subnetId: subnet.id,
    routeTableId: routes.id,
});

// Create a security group allowing inbound access over port 80 and outbound
// access to anywhere.
const applicationSecurityGroup = new awsx.ec2.SecurityGroup("appSecurityGroup", {
        vpc: vpc.id,
        egress: [{ fromPort: 0, toPort: 0, protocol: "-1", cidrBlocks: ["0.0.0.0/0"] }],
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

});

// Find the latest Amazon Linux 2 AMI.
const ami = pulumi.output(aws.ec2.getAmi({
    owners: [ "amazon" ],
    mostRecent: true,
    filters: [
        { name: "description", values: [ "Amazon Linux 2 *" ] },
    ],
}));

console.log(ami, "ami");

// Create and launch an Amazon Linux EC2 instance into the public subnet.
const instance = new aws.ec2.Instance("instance", {
    ami: ami.id,
    instanceType: "t2.micro",
    subnetId: subnet.id,
    vpcSecurityGroupIds: [
        applicationSecurityGroup.id,
    ],
    userData: `
        #!/bin/bash
        amazon-linux-extras install nginx1
        amazon-linux-extras enable nginx
        systemctl enable nginx
        systemctl start nginx
    `,
});

// Export the instance's publicly accessible URL.
module.exports = {
    instanceURL: pulumi.interpolate `http://${instance.publicIp}`,
};