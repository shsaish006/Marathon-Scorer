# ==========================================
# Terraform Lambda - Kafka to Fargate Task Scheduler
# ==========================================

# Lambda executor role
resource "aws_iam_role" "lambda_role" {
  name = "marathon-lambda-execution-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# Ingress policy to allow Lambda to trigger ECS tasks
resource "aws_iam_policy" "lambda_ecs_policy" {
  name        = "marathon-lambda-ecs-policy"
  description = "Allows Lambda scheduler to run ECS Fargate tasks on Kafka events"
  policy      = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecs:RunTask",
          "iam:PassRole"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_ecs_attach" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_ecs_policy.arn
}

# The scheduler Lambda function
resource "aws_lambda_function" "kafka_scheduler" {
  filename      = "lambda_payload.zip" # Packaged runtime artifact
  function_name = "marathon-kafka-task-scheduler"
  role          = aws_iam_role.lambda_role.arn
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  timeout       = 30

  environment {
    variables = {
      ECS_CLUSTER         = aws_ecs_cluster.marathon_cluster.name
      ECS_TASK_DEFINITION = aws_ecs_task_definition.scorer_task.arn
      SUBNETS             = "subnet-12345,subnet-67890"
    }
  }
}
