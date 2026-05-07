# KODI Microservices - Monitoring Setup Guide

This guide explains how to set up and configure the monitoring infrastructure for KODI Microservices.

## Overview

The monitoring stack consists of:

- **Prometheus**: Metrics collection and storage
- **Grafana**: Visualization and dashboards
- **Alertmanager**: Alert routing and notifications
- **Nginx**: Reverse proxy with load balancing
- **RabbitMQ**: Message queue with management UI

## Prerequisites

- Docker and Docker Compose installed
- Ports available: 9090 (Prometheus), 3000 (Grafana), 9093 (Alertmanager), 80/443 (Nginx)
- Sufficient resources: At least 2GB RAM and 10GB disk space

## Quick Start

### 1. Start Monitoring Stack

Add the monitoring services to your `docker-compose.yml`:

```yaml
prometheus:
  image: prom/prometheus:latest
  container_name: kodi-prometheus
  volumes:
    - ./infra/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
    - ./infra/prometheus/alerts:/etc/prometheus/alerts
    - prometheus_data:/prometheus
  command:
    - '--config.file=/etc/prometheus/prometheus.yml'
    - '--storage.tsdb.path=/prometheus'
    - '--web.console.libraries=/usr/share/prometheus/console_libraries'
    - '--web.console.templates=/usr/share/prometheus/consoles'
  ports:
    - '9090:9090'
  networks:
    - backend

grafana:
  image: grafana/grafana:latest
  container_name: kodi-grafana
  volumes:
    - ./infra/grafana/provisioning:/etc/grafana/provisioning
    - grafana_data:/var/lib/grafana
  environment:
    - GF_SECURITY_ADMIN_USER=admin
    - GF_SECURITY_ADMIN_PASSWORD=admin
    - GF_USERS_ALLOW_SIGN_UP=false
  ports:
    - '3000:3000'
  depends_on:
    - prometheus
  networks:
    - backend

alertmanager:
  image: prom/alertmanager:latest
  container_name: kodi-alertmanager
  volumes:
    - ./infra/alertmanager/alertmanager.yml:/etc/alertmanager/alertmanager.yml
  ports:
    - '9093:9093'
  networks:
    - backend
```

### 2. Configure Nginx

If using Nginx as reverse proxy, add to `docker-compose.yml`:

```yaml
nginx:
  image: nginx:alpine
  container_name: kodi-nginx
  volumes:
    - ./infra/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    - ./infra/nginx/ssl:/etc/nginx/ssl:ro
  ports:
    - '80:80'
    - '443:443'
  depends_on:
    - auth
    - users
    - city
    - core
    - notification
    - scheduler
  networks:
    - backend
```

### 3. Update RabbitMQ Configuration

Mount the RabbitMQ config files in your existing RabbitMQ service:

```yaml
rabbitmq:
  # ... existing config ...
  volumes:
    - rabbitmq_data:/var/lib/rabbitmq
    - ./infra/rabbitmq/rabbitmq.conf:/etc/rabbitmq/rabbitmq.conf:ro
```

## Configuration Details

### Prometheus

The Prometheus configuration (`infra/prometheus/prometheus.yml`) includes:

- **Scrape targets**: All active microservices at `/metrics`
- **Scrape interval**: 15 seconds
- **Alert rules**: Defined in `infra/prometheus/alerts/alerts.yml`
- **Alertmanager**: Configured at `alertmanager:9093`

### Grafana

Grafana is pre-configured with:

- **Prometheus datasource**: Automatically provisioned
- **Dashboard provisioning**: Ready for custom dashboards
- **Default credentials**: admin/admin (change in production!)

### Alertmanager

Alert routing is configured for:

- **Critical alerts**: Route to oncall team
- **Warning alerts**: Route to team channel
- **Database alerts**: Route to DBA team
- **Infrastructure alerts**: Route to infra team

Update email/Slack/PagerDuty configurations in `infra/alertmanager/alertmanager.yml`.

### Nginx

Nginx configuration provides:

- **Reverse proxy**: All microservices accessible via `/api/{service}`
- **Load balancing**: Least connections algorithm
- **Rate limiting**: Protection against abuse
- **Health checks**: Automatic failover
- **SSL ready**: Configuration ready for certificates

### RabbitMQ

RabbitMQ includes:

- **Pre-configured queues**: user.created, notification.queue, etc.
- **Exchanges**: Topic and direct exchanges for events
- **Bindings**: Automatic routing rules
- **Management UI**: Available at port 15672
- **Prometheus metrics**: Available at port 15692

## Accessing Services

Once started, access the services:

- **Grafana**: http://localhost:3000 (admin/admin)
- **Prometheus**: http://localhost:9090
- **Alertmanager**: http://localhost:9093
- **Nginx**: http://localhost/api/{service}
- **RabbitMQ Management**: http://localhost:15672

## Metrics Endpoints

Each microservice exposes metrics at:

- Auth: http://localhost:3001/metrics
- Users: http://localhost:3002/metrics
- City: http://localhost:3003/metrics
- Core: http://localhost:3004/metrics
- Notification: http://localhost:3005/metrics
- Scheduler: http://localhost:3006/metrics

## Alert Rules

Pre-configured alerts include:

- **ServiceDown**: Service unavailable for >1 minute
- **HighErrorRate**: Error rate >10% for >5 minutes
- **HighRequestLatency**: 95th percentile latency >1s
- **HighMemoryUsage**: Heap usage >90%
- **DatabaseConnectionFailure**: Database unreachable
- **RedisConnectionFailure**: Redis unreachable
- **RabbitMQConnectionFailure**: RabbitMQ unreachable
- **HighQueueDepth**: Queue depth >10,000 messages

## Production Considerations

### Security

1. **Change default passwords**: Grafana, RabbitMQ, etc.
2. **Enable SSL/TLS**: Configure certificates in Nginx
3. **Restrict access**: Use firewall rules for monitoring ports
4. **Secrets management**: Use environment variables or secrets manager

### Performance

1. **Resource limits**: Set appropriate CPU/memory limits
2. **Storage**: Configure retention policies for Prometheus
3. **Backup**: Regular backups of Grafana dashboards and Prometheus data

### Scaling

1. **Prometheus**: Consider federation or Thanos for long-term storage
2. **Grafana**: Can be scaled horizontally
3. **Nginx**: Add more upstream servers as services scale
4. **RabbitMQ**: Configure clustering for HA

## Troubleshooting

### Prometheus not scraping metrics

- Check service names match docker-compose service names
- Verify `/metrics` endpoint is accessible
- Check Prometheus targets page: http://localhost:9090/targets

### Grafana can't connect to Prometheus

- Verify Prometheus service name is correct
- Check network connectivity in docker-compose
- Review Grafana logs: `docker logs kodi-grafana`

### Alerts not firing

- Verify alert rules syntax: `promtool check rules infra/prometheus/alerts/alerts.yml`
- Check Alertmanager is running and connected
- Review Prometheus alerts page: http://localhost:9090/alerts

## Additional Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Alertmanager Documentation](https://prometheus.io/docs/alerting/latest/alertmanager/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html)
