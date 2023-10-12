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
