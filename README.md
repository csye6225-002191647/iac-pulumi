# iac-pulumi

This GitHub repository is set up to manage the Infrastructure as Code (IaC) using Pulumi for creating and managing AWS networking resources. The infrastructure setup includes creating Virtual Private Cloud (VPC), subnets, route tables, and an Internet Gateway. This repository is intended for use in your AWS environment, allowing you to create multiple VPCs with varying configurations using Pulumi stacks.

## Repository Structure
- `README.md` (This file): Provides an overview and instructions for setting up the infrastructure.
- `.gitignore`: Contains a suitable .gitignore file for this project.
- `pulumi/`: This directory contains the Pulumi project and code for managing AWS networking resources.
- `pulumi/dev`: Contains Pulumi stack configuration for the development environment.
- `pulumi/demo`: Contains Pulumi stack configuration for the demo environment.

## Getting Started

### 1. Setting up the GitHub Repository

- Create a new private GitHub repository in your GitHub organization with the name "iac-pulumi."
- Fork this repository into your GitHub namespace. All development work should be done on your forked repository.
- Clone the forked repository to your local development environment.

### 2. AWS Networking Setup

To set up the AWS networking infrastructure as described, follow these steps:

- Create a Virtual Private Cloud (VPC).
- Create three public subnets and three private subnets, each in a different availability zone within the same region and VPC.
- Create an Internet Gateway resource and attach it to the VPC.
- Create a public route table and associate all public subnets with it.
- Create a private route table and associate all private subnets with it.
- Create a public route in the public route table with a destination CIDR block of `0.0.0.0/0` and the Internet Gateway as the target.

### 3. Infrastructure as Code with Pulumi

- Install and set up the AWS Command Line Interface (CLI) on your local machine.
- Write Pulumi code using a high-level language like JavaScript to define and manage the networking resources in your AWS environment. Ensure that values are not hard-coded in your code, making it reusable for creating multiple VPCs and associated resources.

## Pulumi Stack Configuration

To create multiple VPCs with different configurations, we have set up two Pulumi stacks: `dev` and `demo`. Each stack can be used to deploy the infrastructure in different AWS accounts or regions. To switch between stacks, use the following Pulumi commands:

- `pulumi stack select dev`: Switch to the development stack.
- `pulumi stack select demo`: Switch to the demo stack.

Remember to set up Pulumi configurations for different AWS accounts and regions in each stack as needed.

## Deploying the Pulumi Stacks

To create the VPC and associated resources using Pulumi, you can use the following instructions for each of the two stacks (dev and demo).

### For the `dev` Stack

1. Make sure you have selected the `dev` stack using the Pulumi CLI:

   ```bash
   pulumi stack select dev
   ```

2. Run the `pulumi up` command to create the resources associated with the `dev` stack:

   ```bash
   pulumi up
   ```

3. Review the changes and confirm the creation of resources when prompted.

### For the `demo` Stack

1. Make sure you have selected the `demo` stack using the Pulumi CLI:

   ```bash
   pulumi stack select demo
   ```

2. Run the `pulumi up` command to create the resources associated with the `demo` stack:

   ```bash
   pulumi up
   ```

3. Review the changes and confirm the creation of resources when prompted.

After successfully running the `pulumi up` command for each stack, the VPC and its associated resources will be created in your AWS account.

**Note**: Be cautious when using the `pulumi up` command, as it may result in costs associated with AWS resources. Ensure that you want to deploy the resources before confirming the operation.

Please review the changes and configurations before proceeding to create the resources.

## Destroying the VPC and Associated Resources

To tear down the VPC and associated resources created with Pulumi, you can use the following instructions for each of the two stacks (dev and demo).

### For the `dev` Stack

1. Make sure you have selected the `dev` stack using the Pulumi CLI:

   ```bash
   pulumi stack select dev
   ```

2. Run the `pulumi destroy` command to remove the resources associated with the `dev` stack:

   ```bash
   pulumi destroy
   ```

3. Confirm the destruction of resources when prompted.

### For the `demo` Stack

1. Make sure you have selected the `demo` stack using the Pulumi CLI:

   ```bash
   pulumi stack select demo
   ```

2. Run the `pulumi destroy` command to remove the resources associated with the `demo` stack:

   ```bash
   pulumi destroy
   ```

3. Confirm the destruction of resources when prompted.

After successfully running the `pulumi destroy` command for each stack, the VPC and its associated resources will be deleted from your AWS account.

**Note**: Be cautious when using the `pulumi destroy` command, as it permanently deletes resources. Ensure that you want to destroy the resources before confirming the operation.

Please ensure that you have backups or snapshots of any critical data or configurations that you may need in the future before destroying the resources.

## .gitignore

This repository includes a `.gitignore` file to exclude common build, dependency, and operating system files from version control.

For additional `.gitignore` templates and customization, refer to the [GitHub .gitignore Templates](https://github.com/github/gitignore) repository.

**Please note:** Keep all sensitive information such as AWS access keys and secret keys secure and do not commit them to version control. Use AWS IAM roles or other secure methods for AWS access.

# Infrastructure as Code with Pulumi

This repository and associated Pulumi project demonstrate the automation of infrastructure provisioning using Pulumi, along with the deployment of applications on an Amazon EC2 instance. The primary goal of this assignment is to enable students to launch and manage AWS resources through code, adhering to best practices and ensuring security.

## Assignment-05 Objectives

### 1. Infrastructure Creation and Deletion

- Running `pulumi up` should create the following resources:
  - Networking components
  - Security groups
  - Amazon EC2 instance with the specified Amazon Machine Image (AMI) built during the demo.

- Running `pulumi destroy` should delete all resources created in the previous step, ensuring a clean environment.

### 2. Application Deployment

- Students can SSH into the EC2 instance and start their application. Ensure all APIs implemented in previous assignments, including the health check endpoint, are working correctly.

- **No Dependency Installation:** It is expected that no additional installation of dependencies using commands such as `npm install` or `pip install` should be required. All necessary dependencies should have been installed and set up during the AMI build process.

### 3. Local Database

- For this assignment, students will have a database running locally on the EC2 instance. 

- **Security Group Rules:** Ensure that port 3306 (for MySQL and MariaDB) and port 5432 (for PostgreSQL) are **not** included in the security group configuration. This design restricts external access to the database, making it inaccessible from outside the virtual machine.

### 4. Git Installation Check

- Check for the presence of Git within the AMI using the `which git` command. Git should **not** be installed on the AMI, promoting proper version control practices and avoiding potential security risks.

## Getting Started

To get started with this project, follow these steps:

1. Clone this repository to your local machine.

2. Install Pulumi: If you haven't already, you can install Pulumi by following the official [installation guide](https://www.pulumi.com/docs/get-started/install/).

3. Initialize Pulumi: Run `pulumi up` to create the infrastructure based on the Pulumi project configuration.

4. Deploy Your Application: SSH into the EC2 instance, start your application, and test the APIs.

5. Clean Up: When you're done, you can use `pulumi destroy` to remove all resources created in step 3.

6. Verify Git Installation: You can run `which git` to verify that Git is not installed on the AMI.

Please ensure that you have your AWS credentials properly configured and Pulumi set up to work with your AWS account for this project to work as expected.

For further details on how to use Pulumi and manage your infrastructure with code, refer to the [Pulumi documentation](https://www.pulumi.com/docs/).

**Note:** This assignment serves as a learning exercise and may have additional requirements and instructions provided by the instructor. Make sure to follow the guidelines provided by your course or instructor for specific details regarding the assignment.


# Assignment 06 - Infrastructure as Code with Pulumi

This repository contains code and instructions for creating necessary infrastructure components using [Pulumi](https://www.pulumi.com/) to support a database and EC2 instance for your application. The infrastructure includes a DB Security Group, RDS Parameter Group, RDS Instance, and EC2 User Data.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [DB Security Group](#create-db-security-group)
  - [RDS Parameter Group](#rds-parameter-group)
  - [RDS Instance](#rds-instance)
  - [User Data](#user-data)
- [Warning](#warning)
- [Contributing](#contributing)
- [License](#license)

## Prerequisites

Before you begin, ensure you have the following prerequisites:

- [Pulumi CLI](https://www.pulumi.com/docs/get-started/install/)
- AWS credentials configured

## Getting Started

### Create DB Security Group

The DB Security Group is used to control access to your RDS instance.

1. In your terminal, navigate to the directory containing your Pulumi code.
2. Open your Pulumi code (e.g., `index.js`) and add the necessary logic to create the DB Security Group.
3. Make sure the security group allows ingress traffic on port 3306 for MySQL/MariaDB or 5432 for PostgreSQL.
4. Configure the source of the traffic to be the application security group.
5. Ensure that access to the instance from the internet is restricted.

### RDS Parameter Group

A DB parameter group is used to configure engine settings for your RDS instance.

1. Create a new parameter group that matches your database engine (e.g., Postgres, MySQL, MariaDB) and its version.
2. Ensure that your RDS instance uses the new parameter group instead of the default parameter group.

### RDS Instance

Your RDS instance should be configured as follows:

- **Database Engine:** MySQL/MariaDB/PostgreSQL
- **DB Instance Class:** Use the cheapest available instance class
- **Multi-AZ Deployment:** No
- **DB Instance Identifier:** csye6225
- **Master Username:** csye6225
- **Master Password:** Choose a strong password
- **Subnet Group:** Use Private subnet for RDS instances
- **Public Accessibility:** No
- **Database Name:** csye6225
- Ensure that the Database Security Group is attached to this RDS instance.

### User Data

The EC2 instance should be launched with user data that provides database configuration to the web application.

1. In your Pulumi code for the EC2 instance, add user data to pass the database configuration, such as the username, password, and hostname, to the web application.

## Warning

Setting the RDS instance's "Public Accessibility" to true will expose your instance to the internet. Make sure to set it to "No" unless you have specific use cases that require public access.

## Contributing

Feel free to contribute to this repository by opening issues or pull requests. Your contributions are highly appreciated.

## License

This project is licensed under the [MIT License](LICENSE).

# Amazon Certficate Manager -

   ```bash
   aws acm import-certificate --certificate fileb:///Users/jarvis/Downloads/demo.rohitchouhan.me/certificate.pem --private-key fileb:///Users/jarvis/Downloads/demo.rohitchouhan.me/private.key --certificate-chain fileb:///Users/jarvis/Downloads/demo.rohitchouhan.me/certificate.pem
   ```
