# ==========================================
# Terraform ECS - AWS Fargate Tasks Orchestration
# ==========================================

# ECS on-demand Cluster
resource "aws_ecs_cluster" "marathon_cluster" {
  name = "marathon-scoring-cluster"
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# ECS Task Execution IAM Role
resource "aws_iam_role" "ecs_execution_role" {
  name = "marathon-ecs-execution-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution_attach" {
  role       = aws_iam_role.ecs_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Fargate container Task Definition
resource "aws_ecs_task_definition" "scorer_task" {
  family                   = "marathon-scorer-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "1024" # 1 vCPU
  memory                   = "2048" # 2 GB
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn

  container_definitions = jsonencode([
    {
      name      = "scorer-runner"
      image     = "${aws_ecr_repository.scorer_ecr.repository_url}:latest"
      essential = true
      
      environment = [
        { name = "SSM_PARAMETER_PATH", value = "/marathon/scorer/rules" },
        { name = "REVIEW_API_URL", value = "http://api.marathon.internal/review" }
      ]
      
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/marathon-scorer-runner"
          "awslogs-region"        = "us-east-1"
          "awslogs-stream-prefix" = "fargate"
        }
      }
    }
  ])
}
