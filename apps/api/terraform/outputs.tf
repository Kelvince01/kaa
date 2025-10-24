output "api_url" {
  description = "The URL of the API"
  value       = "https://${var.api_domain}"
}

output "ecr_repository_url" {
  description = "The URL of the ECR repository"
  value       = aws_ecr_repository.api.repository_url
}

output "ecs_cluster_name" {
  description = "The name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "The name of the ECS service"
  value       = aws_ecs_service.api.name
}

output "load_balancer_dns" {
  description = "The DNS name of the load balancer"
  value       = aws_lb.api.dns_name
}
