# ==========================================
# Terraform Go Aggregator - Microservice blueprints
# ==========================================

# Dedicated ECR registry for Go Aggregator
resource "aws_ecr_repository" "go_aggregator_ecr" {
  name                 = "marathon-go-aggregator"
  image_tag_mutability = "MUTABLE"
  image_scanning_configuration {
    scan_on_push = true
  }
}

# Go Aggregator Task Definition
resource "aws_ecs_task_definition" "go_aggregator_task" {
  family                   = "marathon-go-aggregator-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"  # 0.25 vCPU
  memory                   = "512"  # 512 MB
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn

  container_definitions = jsonencode([
    {
      name      = "go-aggregator"
      image     = "${aws_ecr_repository.go_aggregator_ecr.repository_url}:latest"
      essential = true
      
      portMappings = [
        {
          containerPort = 8080
          hostPort      = 8080
        }
      ]
      
      environment = [
        { name = "PORT", value = "8080" },
        { name = "DATABASE_URL", value = "postgres://postgres:marathonpass@db.marathon.internal:5432/marathon_scorer" }
      ]
      
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/marathon-go-aggregator"
          "awslogs-region"        = "us-east-1"
          "awslogs-stream-prefix" = "go-aggregator"
        }
      }
    }
  ])
}
