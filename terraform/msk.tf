# ==========================================
# Terraform MSK - AWS Managed Kafka Broker Clusters
# ==========================================

resource "aws_security_group" "msk_sg" {
  name        = "marathon-msk-sg"
  description = "Allows access to Amazon MSK brokers"
  vpc_id      = aws_vpc.marathon_vpc.id

  ingress {
    from_port   = 9092
    to_port     = 9092
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.marathon_vpc.cidr_block]
  }
}

# High-Availability Amazon MSK Cluster
resource "aws_msk_cluster" "marathon_kafka" {
  cluster_name           = "marathon-submissions-kafka"
  kafka_version          = "3.2.0"
  number_of_broker_nodes = 2

  broker_node_group_info {
    instance_type = "kafka.t3.small"
    client_subnets = [
      "subnet-12345678", # Mock Private Subnet A
      "subnet-87654321"  # Mock Private Subnet B
    ]
    security_groups = [aws_security_group.msk_sg.id]
    storage_info {
      ebs_storage_info {
        volume_size = 50
      }
    }
  }

  encryption_info {
    encryption_in_transit {
      client_broker = "PLAINTEXT"
    }
  }

  tags = {
    Environment = "production"
  }
}
