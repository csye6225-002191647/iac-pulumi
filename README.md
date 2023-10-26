The provided README.md file offers a good starting point for managing your Infrastructure as Code (IaC) using Pulumi to create and manage AWS networking resources. However, there are some specific requirements for your assignment that are not covered in the README. Let's modify the README.md to include those additional requirements:

```markdown
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

## Additional Assignment Requirements

For this assignment, some additional requirements must be met:

- Students must be able to SSH into the EC2 instance created and start their application.
- All APIs implemented in previous assignments, including the health check endpoint, must be tested.
- Dependencies should have been pre-installed and set up when the AMI was built. No running of `npm install` or `pip install` should be required.
- The database (MySQL/MariaDB on port 3306 or PostgreSQL on port 5432) should be running locally on the EC2 instance. Database ports should not be included in the security group, preventing external access to the database.
- Ensure that Git is not installed in the AMI by checking for it using the `which git` command.

Please make sure to modify your Pulumi scripts to meet these requirements for your assignment.
```

The updated README.md now includes the additional assignment requirements related to SSH access, testing APIs, pre-installed dependencies, and database and Git configuration. Make sure to adjust your Pulumi scripts accordingly to meet these requirements.


# Infrastructure as Code with Pulumi

Welcome to the Infrastructure as Code repository using [Pulumi](https://www.pulumi.com/). Here, you'll find code and guidelines for creating essential infrastructure components to support a database and an EC2 instance for your application. This infrastructure setup involves creating a DB Security Group, RDS Parameter Group, RDS Instance, and EC2 User Data.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [Creating the DB Security Group](#create-db-security-group)
  - [Configuring RDS Parameter Group](#rds-parameter-group)
  - [Setting Up the RDS Instance](#rds-instance)
  - [User Data Configuration](#user-data)
- [Important Note](#warning)
- [Contribute](#contributing)
- [License](#license)

## Prerequisites

Before you embark on this journey, ensure you have the following prerequisites in place:

- [Pulumi CLI](https://www.pulumi.com/docs/get-started/install/)
- Configured AWS credentials

## Getting Started

### Creating the DB Security Group

The DB Security Group is crucial for controlling access to your RDS instance. Here's how to set it up:

1. Navigate to the directory containing your Pulumi code using your terminal.
2. Open your Pulumi code file (e.g., `index.ts`) and include the logic for creating the DB Security Group.
3. Ensure the security group allows incoming traffic on port 3306 for MySQL/MariaDB or 5432 for PostgreSQL.
4. Configure the source of the traffic to be the application's security group.
5. Be certain that access to the instance from the internet is restricted.

### Configuring RDS Parameter Group

A DB parameter group is essential for configuring engine settings for your RDS instance. Follow these steps:

1. Create a new parameter group that matches your database engine (e.g., Postgres, MySQL, MariaDB) and its version.
2. Ensure that your RDS instance uses the new parameter group instead of the default parameter group.

### Setting Up the RDS Instance

Your RDS instance should be configured with the following details:

- **Database Engine:** MySQL/MariaDB/PostgreSQL
- **DB Instance Class:** Use the most cost-effective available instance class.
- **Multi-AZ Deployment:** No
- **DB Instance Identifier:** csye6225
- **Master Username:** csye6225
- **Master Password:** Choose a strong password
- **Subnet Group:** Utilize a Private subnet for RDS instances.
- **Public Accessibility:** No
- **Database Name:** csye6225
- Ensure that the Database Security Group is attached to this RDS instance.

### User Data Configuration

The EC2 instance should be launched with user data that provides database configuration to the web application. To achieve this:

1. In your Pulumi code for the EC2 instance, add user data to pass database configuration information, such as the username, password, and hostname, to the web application.

## Important Note

Be cautious with the "Public Accessibility" setting of your RDS instance. Setting it to true will expose your instance to the internet. Make sure to set it to "No" unless you have specific use cases that require public access.

## Contribute

You are encouraged to contribute to this repository by opening issues or pull requests. Your contributions are highly valued and appreciated.

## License

This project is licensed under the [MIT License](LICENSE).