# MotorTech Keep-Alive Service

This service prevents your Render backend from going idle by sending periodic ping requests every 14 minutes.

## Files Created

- `backend/keep-alive.js` - The main keep-alive script
- `render-keepalive.yaml` - Render configuration for deploying as a worker service

## How It Works

- Sends GET requests to `https://motorpoint.onrender.com/api/health` every 14 minutes
- Logs successful pings and any errors encountered
- Includes proper error handling for connection issues
- Runs efficiently in the background with minimal resource usage

## Local Testing

```bash
cd backend
node keep-alive.js
```

You should see output like:
```
[2025-09-11T07:07:45.880Z] [INFO] 🚀 MotorTech Keep-Alive Service starting...
[2025-09-11T07:07:45.892Z] [INFO] Server URL: https://motorpoint.onrender.com/api/health
[2025-09-11T07:07:47.544Z] [SUCCESS] ✅ Ping successful - Status: 200, Response time: 1569ms, Data: 165 bytes
```

## Deployment Options

### Option 1: Separate Render Worker Service (Recommended)

1. Create a new service on Render
2. Choose "Worker" as the service type
3. Connect your GitHub repository
4. Use these settings:
   - **Build Command**: `echo "No build required for keep-alive worker"`
   - **Start Command**: `node keep-alive.js`
   - **Root Directory**: `backend`
   - **Environment**: `NODE_ENV=production`

### Option 2: Use the Render Configuration File

1. Update the `render-keepalive.yaml` file with your actual GitHub repository URL
2. Deploy using Render's Infrastructure as Code:
   ```bash
   render deploy --file render-keepalive.yaml
   ```

### Option 3: External Service (Alternative)

You can also use external services like:
- UptimeRobot (free tier available)
- Pingdom
- StatusCake

Simply configure them to ping `https://motorpoint.onrender.com/api/health` every 14 minutes.

## Configuration

The script can be customized by modifying these variables in `keep-alive.js`:

```javascript
const SERVER_URL = 'https://motorpoint.onrender.com/api/health'; // URL to ping
const PING_INTERVAL = 14 * 60 * 1000; // 14 minutes in milliseconds
const TIMEOUT = 30000; // 30 seconds timeout
```

## Monitoring

The script provides detailed logging:
- `INFO`: General information and startup messages
- `SUCCESS`: Successful ping responses with timing data
- `ERROR`: Failed ping attempts with error details
- `FATAL`: Critical errors that cause the service to exit

## Resource Usage

- **Memory**: ~10-20MB
- **CPU**: Minimal (only active during ping requests)
- **Network**: ~1KB per ping request
- **Cost**: Free tier compatible on most platforms

## Troubleshooting

### Common Issues

1. **404 Errors**: Make sure your backend has a `/api/health` endpoint
2. **Connection Timeouts**: Check if your server is running and accessible
3. **SSL Errors**: Ensure your server has valid SSL certificates

### Logs Analysis

- Response times > 5000ms may indicate server performance issues
- Frequent connection errors may indicate network problems
- HTTP status codes other than 200 indicate server-side issues

## Security Considerations

- The script only sends GET requests to the health endpoint
- No sensitive data is transmitted
- Uses standard HTTP/HTTPS protocols
- Includes proper User-Agent identification

## Alternative Solutions

If you prefer not to run a separate keep-alive service, consider:

1. **Upgrading to Render's paid plan** (no idle timeout)
2. **Using Render Cron Jobs** for periodic health checks
3. **Implementing client-side keep-alive** in your frontend application