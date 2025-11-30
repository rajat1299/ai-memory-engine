## Production Checklist

### Security

- [ ] Use strong, unique `POSTGRES_PASSWORD`
- [ ] Enable SSL for database connections (`?sslmode=require`)
- [ ] Put API behind a reverse proxy (nginx, Traefik)
- [ ] Enable HTTPS
- [ ] Set `API_RATE_LIMIT` appropriately
- [ ] Rotate API keys periodically
- [ ] Never commit `.env` to git

### Performance

- [ ] Use managed PostgreSQL (Neon, Supabase, RDS)
- [ ] Use managed Redis (Upstash, ElastiCache)
- [ ] Scale workers based on queue depth
- [ ] Monitor embedding API costs
- [ ] Set up log aggregation

### Reliability

- [ ] Configure database backups
- [ ] Set up health check monitoring
- [ ] Configure alerting (PagerDuty, Slack)
- [ ] Test disaster recovery
- [ ] Document runbooks

### Monitoring

```bash
# Check API health
curl http://your-domain/health

# Check worker status
docker-compose exec worker arq info

# View recent jobs
docker-compose logs --tail=100 worker
```
