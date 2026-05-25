# ==========================================
# Terraform Main Config - AWS Infrastructure Setup
# ==========================================

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

# Dynamic VPC configuration
resource "aws_vpc" "marathon_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = {
    Name = "marathon-scorer-vpc"
  }
}

# ECR docker image registry setup
resource "aws_ecr_repository" "scorer_ecr" {
  name                 = "marathon-scorer-runner"
  image_tag_mutability = "MUTABLE"
  image_scanning_configuration {
    scan_on_push = true
  }
  tags = {
    Environment = "production"
  }
}
