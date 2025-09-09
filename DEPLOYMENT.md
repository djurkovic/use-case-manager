# Deployment Guide

This guide covers different deployment scenarios for the AI Use Case Manager.

## 🏠 Local Development

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Optional: Docker for NocoDB

### Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Access the application
open http://localhost:3000
```

## 🌐 Production Deployment

### Option 1: Local Server with NocoDB

1. **Set up NocoDB:**
   ```bash
   # Using Docker (recommended)
   docker run -d --name nocodb \
     -p 8080:8080 \
     -v nocodb_data:/usr/app/data/ \
     nocodb/nocodb:latest
   
   # Or using npm
   npm install -g nocodb
   nocodb
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your NocoDB credentials
   ```

3. **Start the application:**
   ```bash
   npm run web
   ```

### Option 2: Docker Deployment

1. **Create Dockerfile:**
   ```dockerfile
   FROM node:18-alpine
   
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   
   COPY . .
   
   EXPOSE 3000
   CMD ["npm", "run", "web"]
   ```

2. **Create docker-compose.yml:**
   ```yaml
   version: '3.8'
   services:
     nocodb:
       image: nocodb/nocodb:latest
       ports:
         - "8080:8080"
       volumes:
         - nocodb_data:/usr/app/data/
       environment:
         NC_DB: sqlite3://data/noco.db
         
     use-case-manager:
       build: .
       ports:
         - "3000:3000"
       environment:
         - NOCODB_BASE_URL=http://nocodb:8080
         - NOCODB_API_TOKEN=your_token_here
         - NOCODB_TABLE_ID=your_table_id
       depends_on:
         - nocodb
         
   volumes:
     nocodb_data:
   ```

3. **Deploy:**
   ```bash
   docker-compose up -d
   ```

### Option 3: Heroku Deployment

1. **Create Procfile:**
   ```
   web: npm run web
   ```

2. **Set environment variables:**
   ```bash
   heroku config:set NOCODB_BASE_URL=your_nocodb_url
   heroku config:set NOCODB_API_TOKEN=your_token
   heroku config:set NOCODB_TABLE_ID=your_table_id
   ```

3. **Deploy:**
   ```bash
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Web server port | 3000 |
| `NODE_ENV` | Environment | development |
| `NOCODB_BASE_URL` | NocoDB instance URL | http://localhost:8080 |
| `NOCODB_API_TOKEN` | NocoDB API token | - |
| `NOCODB_TABLE_ID` | NocoDB table ID (v2 API) | - |

### NocoDB Setup Steps

1. **Access NocoDB interface:**
   - Open http://localhost:8080 (or your NocoDB URL)
   - Create account and login

2. **Create project:**
   - Click "New Project"
   - Choose "Create new project"
   - Name it (e.g., "AI Use Cases")

3. **Create table:**
   - Click "Add new table"
   - Name: `use_cases`
   - Add columns as per schema in README

4. **Get API credentials:**
   - Go to Account Settings
   - Generate API token
   - Copy project ID from URL

5. **Test connection:**
   ```bash
   curl -H "xc-token: YOUR_API_TOKEN" \
        "YOUR_NOCODB_URL/api/v1/db/data/v1/PROJECT_ID/use_cases"
   ```

## 🔒 Security Considerations

### Production Checklist

- [ ] Change default ports
- [ ] Set up HTTPS/TLS
- [ ] Configure firewall rules
- [ ] Set strong NocoDB admin password
- [ ] Use environment-specific API tokens
- [ ] Enable NocoDB authentication
- [ ] Regular backups
- [ ] Monitor logs

### Recommended Security Headers

Add to your reverse proxy or server configuration:
```
Content-Security-Policy: default-src 'self'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

## 📊 Monitoring

### Health Checks

The application provides these endpoints for monitoring:

- `GET /api/use-cases` - Database connectivity
- `GET /` - Frontend availability

### Logging

Application logs include:
- HTTP request logs
- Database operation logs  
- Error tracking
- Performance metrics

### Backup Strategy

1. **NocoDB backups:**
   ```bash
   # Export data
   curl -H "xc-token: TOKEN" \
        "NOCODB_URL/api/v1/db/data/v1/PROJECT/use_cases" > backup.json
   ```

2. **Local storage backups:**
   ```bash
   # Automatic via CLI
   ucm backup
   
   # Manual file copy
   cp data/use-cases.json backups/use-cases-$(date +%Y%m%d).json
   ```

## 🔄 Updates and Maintenance

### Update Process

1. **Backup data first:**
   ```bash
   ucm backup
   ```

2. **Update application:**
   ```bash
   git pull origin main
   npm install
   npm run web
   ```

3. **Test functionality:**
   - Verify web interface loads
   - Test CRUD operations
   - Check grid functionality
   - Validate CLI commands

### Database Migrations

If data model changes occur:

1. Export existing data
2. Update table schema in NocoDB
3. Run migration scripts (if provided)
4. Import transformed data
5. Validate data integrity

## 🚨 Troubleshooting

### Common Issues

**Application won't start:**
- Check port availability: `lsof -i :3000`
- Verify Node.js version: `node --version`
- Check dependencies: `npm ls`

**NocoDB connection failed:**
- Verify NocoDB is running: `curl NOCODB_URL/dashboard`
- Check API token validity
- Confirm project ID is correct
- Review firewall/network settings

**Data not saving:**
- Check NocoDB table permissions
- Verify API token has write access
- Review application logs for errors
- Test with local storage fallback

**Grid not loading:**
- Check browser console for errors
- Verify API responses return data
- Clear browser cache
- Check network connectivity

### Debug Mode

Enable detailed logging:
```bash
DEBUG=* npm run web
```

### Support

For issues:
1. Check logs first
2. Verify configuration
3. Test with minimal setup
4. Create GitHub issue with details

## 📈 Performance Optimization

### Frontend
- Enable gzip compression
- Minimize JavaScript bundles  
- Optimize images and assets
- Use CDN for static files

### Backend
- Implement caching
- Database query optimization
- Connection pooling
- Rate limiting

### Infrastructure
- Load balancer for scaling
- Database replicas
- Content delivery network
- Application monitoring