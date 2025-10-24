variable "aws_region" {
  description = "The AWS region to deploy to"
  type        = string
  default     = "eu-west-1"
}

variable "project_name" {
  description = "The name of the project"
  type        = string
  default     = "kenya-rentals"
}

variable "availability_zones" {
  description = "The availability zones to deploy to"
  type        = list(string)
  default     = ["eu-west-1a", "eu-west-1b", "eu-west-1c"]
}

variable "api_domain" {
  description = "The domain name for the API"
  type        = string
}

variable "route53_zone_id" {
  description = "The Route 53 hosted zone ID"
  type        = string
}

variable "acm_certificate_arn" {
  description = "The ARN of the ACM certificate for the API domain"
  type        = string
}

variable "api_min_instances" {
  description = "The minimum number of API instances"
  type        = number
  default     = 2
}

variable "api_max_instances" {
  description = "The maximum number of API instances"
  type        = number
  default     = 10
}

variable "api_cpu" {
  description = "The CPU units for the API task"
  type        = string
  default     = "512"
}

variable "api_memory" {
  description = "The memory for the API task"
  type        = string
  default     = "1024"
}

variable "mongodb_uri" {
  description = "The MongoDB connection URI"
  type        = string
  sensitive   = true
}

variable "mongodb_read_uri" {
  description = "The MongoDB read replica connection URI"
  type        = string
  sensitive   = true
}

variable "mongodb_pool_size" {
  description = "The MongoDB connection pool size"
  type        = number
  default     = 10
}

variable "redis_host" {
  description = "The Redis host"
  type        = string
}

variable "redis_port" {
  description = "The Redis port"
  type        = number
  default     = 6379
}

variable "redis_password" {
  description = "The Redis password"
  type        = string
  sensitive   = true
}

variable "sentry_dsn" {
  description = "The Sentry DSN"
  type        = string
  sensitive   = true
}
