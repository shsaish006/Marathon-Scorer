# ==========================================
# Terraform SSM - AWS Parameter Store configurations
# ==========================================

# active evaluation method
resource "aws_ssm_parameter" "scoring_strategy" {
  name        = "/marathon/scorer/rules/SCORING_STRATEGY"
  description = "Active evaluation method strategy: provisional, example or both"
  type        = "String"
  value       = "provisional"
}

# runner maximum parallel workloads limits
resource "aws_ssm_parameter" "max_concurrent_tasks" {
  name        = "/marathon/scorer/rules/MAX_CONCURRENT_TASKS"
  description = "Maximum parallel Fargate scoring container tasks running"
  type        = "String"
  value       = "5"
}

# execution run timeout limit
resource "aws_ssm_parameter" "scoring_timeout" {
  name        = "/marathon/scorer/rules/SCORING_TIMEOUT_SEC"
  description = "Time limit cutoff for active runner processes before termination"
  type        = "String"
  value       = "180"
}
