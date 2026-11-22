# HotelOS Operations Runbook

**Version:** 1.0  
**Last Updated:** 2024  
**Maintainer:** DevOps Team

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Deployment Procedures](#deployment-procedures)
3. [Rollback Procedures](#rollback-procedures)
4. [Incident Response](#incident-response)
5. [Monitoring & Alerting](#monitoring--alerting)
6. [Database Operations](#database-operations)
7. [Security Operations](#security-operations)
8. [Disaster Recovery](#disaster-recovery)
9. [Runbook Maintenance](#runbook-maintenance)

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                      HotelOS Architecture                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │  Frontend │    │  Frontend │    │  Frontend │              │
│  │ SuperAdmin│    │  SubAdmin │    │  Guest/Kiosk│            │
│  └────┬─────┘    └────┬─────┘    └────┬─────┘              │
│       │               │               │                     │
│       └───────────────┼───────────────┘                     │
│                       ▼                                     │
│              ┌──────────────────┐                           │
│              │   API Gateway    │                           │
│              │  (Nginx/CloudFlare)                           │
│              └────────┬─────────┘                           │
│                       ▼                                     │
│         ┌────────────────────────┐                         │
│         │      Backend API       │                         │
│         │  (Node.js/Express)     │                         │
│         └───────────┬────────────┘                         │
│                     ▼                                     │
│    ┌───────────────┼───────────────┐                      │
│    ▼               ▼               ▼                       │
│┌─────────┐    ┌──────────┐    ┌──────────┐               │
││ MongoDB │    │  Redis   │    │  S3/R2   │               │
││ (Primary)│   │ (Cache/   │    │ (Files/   │               │
││          │   │  Sessions)│   │  Backups) │               │
│└─────────┘    └──────────┘    └──────────┘               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Key Services

| Service     | Technology      | Port  | Health Endpoint           |
| ----------- | --------------- | ----- | ------------------------- |
| Backend API | Node.js/Express | 5001  | `/api/v1/health`          |
| MongoDB     | MongoDB 6.0+    | 27017 | `db.adminCommand('ping')` |
| Redis       | Redis 7.0+      | 6379  | `PING`                    |
| Socket.io   | WebSocket       | 5001  | Same as API               |

---

## Deployment Procedures

### Prerequisites

- Node.js 20.x LTS
- pnpm 8.x
- MongoDB 6.0+
- Redis 7.0+
- Docker (optional, for containerized deploy)

### Environment Variables

```bash
# Required
MONGODB_URI=mongodb://localhost:27017/hotelos
JWT_SECRET=<32+ char secret>
REDIS_URL=redis://localhost:6379

# Frontend URLs (comma-separated for CORS)
SUPER_ADMIN_FRONTEND_URL=https://admin.hotelos.com
SUB_ADMIN_FRONTEND_URL=https://subadmin.hotelos.com
RECEPTIONIST_FRONTEND_URL=https://reception.hotelos.com
KITCHEN_FRONTEND_URL=https://kitchen.hotelos.com
GUEST_FRONTEND_URL=https://guest.hotelos.com
SELF_CHECKIN_FRONTEND_URL=https://checkin.hotelos.com
TABLE_ORDER_FRONTEND_URL=https://order.hotelos.com

# Optional
RAZORPAY_KEY_ID=rzp_...
RAZORPAY_KEY_SECRET=...
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=...
EMAIL_PASSWORD=...
```

### Standard Deployment (Manual)

```bash
# 1. Pull latest code
git pull origin main

# 2. Install dependencies
pnpm install --frozen-lockfile

# 3. Run database migrations (if any)
pnpm run migrate

# 4. Build frontend apps
pnpm --filter super-admin build
pnpm --filter table-order build

# 5. Run tests
pnpm test

# 6. Start application
pnpm --filter backend start

# 7. Verify health
curl -f http://localhost:5001/api/v1/health
```

### Docker Deployment

```bash
# Build image
docker build -t hotelos/backend:latest ./apps/backend
docker build -t hotelos/super-admin:latest ./apps/super-admin
docker build -t hotelos/table-order:latest ./apps/table-order

# Run with docker-compose
docker-compose -f docker-compose.prod.yml up -d

# Verify
curl -f http://localhost:5001/api/v1/health
```

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm test

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker build -t hotelos/backend:${{ github.sha }} ./apps/backend
      - run: docker push registry.example.com/hotelos/backend:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: production
    steps:
      - run: |
          ssh deploy@prod-server "
            docker pull registry.example.com/hotelos/backend:${{ github.sha }}
            docker-compose -f docker-compose.prod.yml up -d --no-deps backend
            sleep 10
            curl -f http://localhost:5001/api/v1/health || exit 1
          "
```

---

## Rollback Procedures

### Application Rollback

```bash
# 1. Identify previous stable version
git log --oneline -10

# 2. Checkout previous version
git checkout <previous-stable-commit>

# 2. Rebuild and deploy
pnpm install --frozen-lockfile
pnpm --filter super-admin build
pnpm --filter table-order build
pnpm --filter backend start

# OR using Docker
docker tag hotelos/backend:<previous-tag> hotelos/backend:latest
docker-compose -f docker-compose.prod.yml up -d --no-deps backend
```

### Database Rollback

```bash
# MongoDB Point-in-Time Recovery
# Requires: MongoDB replica set with oplog

# 1. Stop application
pnpm --filter backend stop

# 2. Restore from backup
mongorestore --uri="$MONGODB_URI" --oplogReplay --oplogLimit=<timestamp> /backup/mongodb/

# 3. Verify data integrity
mongo --eval "db.runCommand({ connectionStatus: 1 })"

# 4. Restart application
pnpm --filter backend start

# 5. Verify health
curl -f http://localhost:5001/api/v1/health
```

### Configuration Rollback

```bash
# Revert environment variables
# 1. Restore previous .env file
cp .env.backup .env

# 2. Restart services
pm2 restart all
# OR
docker-compose restart
```

### Frontend Rollback

```bash
# Netlify/Vercel: Use dashboard to rollback to previous deploy
# OR CLI:
netlify deploy --dir=apps/super-admin/dist --alias=production --commit=<previous-commit>

# Docker:
docker tag hotelos/super-admin:<previous-tag> hotelos/super-admin:latest
docker-compose up -d --no-deps super-admin
```

---

## Incident Response

### Severity Levels

| Level     | Definition                                            | Response Time | Escalation         |
| --------- | ----------------------------------------------------- | ------------- | ------------------ |
| **SEV-1** | Critical: Complete outage, data loss, security breach | 15 min        | CTO, Security Lead |
| **SEV-2** | Major: Partial outage, degraded performance           | 30 min        | DevOps Lead        |
| **SEV-3** | Minor: Non-critical bug, minor degradation            | 2 hours       | On-call Engineer   |
| **SEV-4** | Low: Cosmetic issue, enhancement                      | Next sprint   | Team               |

### Incident Response Flow

```
┌─────────────┐
│  Alert/Report│
└──────┬──────┘
       ▼
┌─────────────┐
│  Triage      │──→ Is it real? ──No──→ Close
└──────┬──────┘
       │ Yes
       ▼
┌─────────────┐
│  Severity    │
└──────┬──────┘
       ▼
┌─────────────┐
│  Assemble    │
│  Team        │
└──────┬──────┘
       ▼
┌─────────────┐
│  Mitigate    │──→ Service restored? ──No──→ Escalate
└──────┬──────┘
       │ Yes
       ▼
┌─────────────┐
│  Root Cause  │
│  Analysis    │
└──────┬──────┘
       ▼
┌─────────────┐
│  Post-Mortem │
│  & Action    │
│  Items       │
└─────────────┘
```

### Common Incident Playbooks

#### Playbook: API Down (SEV-1)

```bash
# 1. Check service status
curl -f http://localhost:5001/api/v1/health

# 2. Check process
ps aux | grep node
pm2 status

# 3. Check logs
pm2 logs backend --lines 100
# OR
docker logs hotelos-backend --tail 100

# 4. Check dependencies
curl -f http://localhost:27017  # MongoDB
redis-cli ping  # Redis

# 5. Restart if needed
pm2 restart backend
# OR
docker-compose restart backend

# 6. Verify
curl -f http://localhost:5001/api/v1/health
```

#### Playbook: Database Connection Issues (SEV-1)

```bash
# 1. Check MongoDB status
mongosh --eval "db.runCommand({ connectionStatus: 1 })"

# 2. Check replica set status
mongosh --eval "rs.status()"

# 3. Check logs
tail -f /var/log/mongodb/mongod.log

# 4. Restart MongoDB if needed
sudo systemctl restart mongod

# 5. Verify replica set health
mongosh --eval "rs.isMaster()"
```

#### Playbook: High Memory/CPU (SEV-2)

```bash
# 1. Identify process
top -p $(pgrep -f "node.*server.js")

# 2. Check for memory leaks
node --inspect=0.0.0.0:9229 src/server.js
# Connect Chrome DevTools to analyze heap

# 3. Restart with increased memory if needed
NODE_OPTIONS="--max-old-space-size=4096" pm2 restart backend
```

#### Playbook: Security Breach (SEV-1)

```bash
# 1. Isolate affected systems
# Block suspicious IPs at firewall/WAF

# 2. Preserve evidence
# Snapshot affected databases
# Export relevant logs

# 3. Rotate secrets
# Generate new JWT_SECRET
# Rotate API keys (Razorpay, email, etc.)
# Update .env and restart services

# 4. Force logout all users
# Invalidate all sessions
mongosh --eval "db.sessions.updateMany({}, { \$set: { status: 'REVOKED' } })"

# 5. Notify stakeholders
# Security team, legal, affected users (if PII exposed)

# 6. Document everything for post-mortem
```

#### Playbook: Slow Performance (SEV-2/3)

```bash
# 1. Check current load
htop
iostat -x 1

# 2. Check database slow queries
mongosh --eval "db.setProfilingLevel(2, { slowms: 100 })"
# Wait, then:
mongosh --eval "db.system.profile.find().sort({ ts: -1 }).limit(10).pretty()"

# 3. Check Redis memory
redis-cli INFO memory

# 4. Check for missing indexes
mongosh --eval "db.bookings.getIndexes()"

# 5. Consider scaling
# Add read replicas
# Increase instance size
# Add caching layer
```

---

## Monitoring & Alerting

### Key Metrics to Monitor

| Metric                  | Warning Threshold | Critical Threshold | Tool               |
| ----------------------- | ----------------- | ------------------ | ------------------ |
| API Response Time (p95) | > 1s              | > 3s               | Prometheus/Grafana |
| API Error Rate          | > 1%              | > 5%               | Prometheus/Grafana |
| CPU Usage               | > 70%             | > 90%              | Node Exporter      |
| Memory Usage            | > 75%             | > 90%              | Node Exporter      |
| Disk Usage              | > 80%             | > 90%              | Node Exporter      |
| MongoDB Connections     | > 80% max         | > 95% max          | MongoDB Exporter   |
| Redis Memory            | > 75%             | > 90%              | Redis Exporter     |
| Queue Depth (BullMQ)    | > 100             | > 1000             | Custom             |

### Alert Rules (Prometheus)

```yaml
groups:
  - name: hotelos-api
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High API error rate"

      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 3
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High API latency"

      - alert: HighMemoryUsage
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes > 0.9
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High memory usage"

      - alert: DatabaseConnectionsHigh
        expr: mongodb_connections / mongodb_connections_available > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "MongoDB connections high"

      - alert: RedisMemoryHigh
        expr: redis_memory_used_bytes / redis_memory_max_bytes > 0.85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Redis memory usage high"
```

### Log Monitoring (ELK/Loki)

```yaml
# Key log queries for alerting
- alert: AuthenticationFailures
  query: 'level:error AND message:"Login failed"'
  threshold: 10/minute

- alert: ValidationErrors
  query: 'level:warn AND message:"Validation failed"'
  threshold: 50/minute

- alert: DatabaseErrors
  query: 'level:error AND (message:"MongoDB" OR message:"Mongoose")'
  threshold: 5/minute

- alert: SecurityEvents
  query: 'level:warn AND (message:"CSRF" OR message:"NoSQL" OR message:"Rate limit")'
  threshold: 20/minute
```

---

## Database Operations

### Routine Maintenance

```bash
# Weekly
# 1. Check index usage
mongosh --eval "db.bookings.aggregate([{ \$indexStats: {} }])"

# 2. Check fragmentation
mongosh --eval "db.runCommand({ collStats: 'bookings' })"

# 3. Update statistics
mongosh --eval "db.runCommand({ planCacheClear: 'bookings' })"

# Monthly
# 1. Rebuild indexes (during maintenance window)
mongosh --eval "db.bookings.reIndex()"

# 2. Compact collections (if needed)
mongosh --eval "db.runCommand({ compact: 'bookings' })"

# 3. Review slow query logs
mongosh --eval "db.system.profile.find().sort({ ts: -1 }).limit(20).pretty()"
```

### Backup Strategy

```bash
# Daily incremental (automated via cron)
# 0 2 * * * /scripts/backup-mongodb.sh incremental

# Weekly full (automated via cron)
# 0 3 * * 0 /scripts/backup-mongodb.sh full

# Backup script template
#!/bin/bash
BACKUP_DIR="/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
TYPE=$1  # "full" or "incremental"

if [ "$TYPE" = "full" ]; then
  mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR/full_$DATE"
  # Upload to S3
  aws s3 sync "$BACKUP_DIR/full_$DATE" s3://hotelos-backups/mongodb/full_$DATE/
else
  mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR/incr_$DATE" --oplog
  aws s3 sync "$BACKUP_DIR/incr_$DATE" s3://hotelos-backups/mongodb/incr_$DATE/
fi

# Cleanup old local backups (keep 7 days)
find "$BACKUP_DIR" -type d -mtime +7 -exec rm -rf {} \;
```

### Restore Procedures

```bash
# Full restore
mongorestore --uri="$MONGODB_URI" --drop /backups/mongodb/full_20240115_020000

# Point-in-time recovery (requires oplog)
mongorestore --uri="$MONGODB_URI" --oplogReplay --oplogLimit=1705312800:1 /backups/mongodb/incr_20240115_020000

# Single collection restore
mongorestore --uri="$MONGODB_URI" --nsInclude="hotelos.bookings" /backups/mongodb/full_20240115_020000
```

---

## Security Operations

### Certificate Management

```bash
# Check SSL certificate expiry
openssl x509 -in /etc/ssl/certs/hotelos.crt -text -noout | grep "Not After"

# Renew Let's Encrypt (if using certbot)
certbot renew --dry-run
certbot renew

# Reload nginx after renewal
nginx -s reload
```

### Secret Rotation

```bash
# Rotate JWT Secret (quarterly)
# 1. Generate new secret
openssl rand -base64 48

# 2. Update in .env and secrets manager
# 3. Deploy with rolling restart (allow both old/new during transition)
# 4. Invalidate all sessions after transition
mongosh --eval "db.sessions.updateMany({}, { \$set: { status: 'REVOKED' } })"

# 5. Verify
curl -f http://localhost:5001/api/v1/health
```

### Security Scanning

```bash
# Weekly automated scan
# 1. Dependency scan
pnpm audit --audit-level=high

# 2. Container scan (if using Docker)
docker scan hotelos/backend:latest

# 3. SAST scan (GitHub CodeQL)
# Runs automatically on PR

# 4. DAST scan (OWASP ZAP)
docker run -t owasp/zap2docker-stable zap-baseline.py -t https://api.hotelos.com
```

---

## Disaster Recovery

### Recovery Time Objectives (RTO)

| Scenario               | RTO      | RPO      |
| ---------------------- | -------- | -------- |
| Single service failure | 15 min   | 0        |
| Database failure       | 1 hour   | 15 min   |
| Data center outage     | 4 hours  | 1 hour   |
| Complete region loss   | 24 hours | 24 hours |

### DR Procedures

#### Scenario: Primary Database Lost

```bash
# 1. Promote replica to primary
mongosh --eval "rs.stepDown()"  # On current primary
mongosh --eval "rs.freeze(120)"  # On new primary candidate
# Wait for election

# 2. Update connection strings
# Update MONGODB_URI in .env to new primary

# 3. Restart application
pm2 restart all

# 4. Verify
curl -f http://localhost:5001/api/v1/health
```

#### Scenario: Complete Data Center Outage

```bash
# 1. Activate DR environment
# Terraform apply -target=aws.dr_infrastructure

# 2. Restore database from latest backup
mongorestore --uri="$DR_MONGODB_URI" s3://hotelos-dr-backups/latest/

# 3. Update DNS
# Route53 failover to DR region

# 4. Deploy application to DR
docker-compose -f docker-compose.dr.yml up -d

# 5. Verify all services
curl -f https://dr-api.hotelos.com/api/v1/health
```

---

## Runbook Maintenance

### Review Schedule

| Frequency   | Activity                           | Owner             |
| ----------- | ---------------------------------- | ----------------- |
| Weekly      | Review alerts, update thresholds   | DevOps            |
| Monthly     | Test rollback procedures           | DevOps            |
| Quarterly   | Full DR drill                      | DevOps + Security |
| Per Release | Update runbook with new procedures | DevOps            |

### Version Control

```bash
# This runbook is version-controlled in Git
# Location: /RUNBOOK.md
# Changes require PR approval from DevOps Lead

# To update:
git checkout -b runbook/update-<topic>
# Edit RUNBOOK.md
git commit -m "runbook: update <topic>"
git push && create PR
```

### Knowledge Base

| Resource              | Location                        |
| --------------------- | ------------------------------- |
| Architecture Docs     | `/docs/architecture/`           |
| API Documentation     | `/api/v1/docs` (Swagger UI)     |
| Deployment Scripts    | `/scripts/deploy/`              |
| Backup Scripts        | `/scripts/backup/`              |
| Monitoring Dashboards | Grafana: `hotelos-*` dashboards |
| Alert Rules           | `/monitoring/alerts.yml`        |

---

## Emergency Contacts

| Role             | Name | Phone | Email | Slack |
| ---------------- | ---- | ----- | ----- | ----- |
| CTO              |      |       |       |       |
| DevOps Lead      |      |       |       |       |
| Security Lead    |      |       |       |       |
| Backend Lead     |      |       |       |       |
| On-Call Engineer |      |       |       |       |

---

## Appendix: Useful Commands

```bash
# View all pm2 processes
pm2 list
pm2 monit

# View logs
pm2 logs backend --lines 200 --timestamp

# Restart specific service
pm2 restart backend

# Check MongoDB status
mongosh --eval "db.runCommand({ serverStatus: 1 })"

# Check Redis status
redis-cli INFO

# Check disk space
df -h

# Check network connections
netstat -tulpn | grep -E "5001|27017|6379"

# Force kill stuck process
kill -9 $(lsof -t -i:5001)

# View systemd service status
systemctl status mongod redis nginx
```

---

_End of Runbook_

**Next Review Date:** 2025-01-01  
**Document Owner:** DevOps Team
