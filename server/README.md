# PDF Watermarking System

This system protects your magazine PDFs by adding user-specific watermarks when users download them. Each PDF is personalized with the user's information, making it easier to track unauthorized sharing.

## Features

- **User-specific watermarks**: Each downloaded PDF contains the user's name, ID, email, and download timestamp
- **Multiple watermark positions**: Header, footer, center (rotated), and corner watermarks for maximum protection
- **Access control integration**: Works with your existing magazine access system
- **Download logging**: Tracks who downloaded what and when for security analytics
- **Secure download URLs**: PDFs can only be downloaded through the protected endpoint

## Setup Instructions

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Environment Configuration

Copy the environment template:
```bash
cp .env.example .env
```

Edit the `.env` file with your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
PORT=3002
```

### 3. Database Setup

Run the migration to create the download logs table:
```sql
-- Run this in your Supabase SQL editor
-- File: database/migrations/20240212_create_download_logs_table.sql
```

### 4. Frontend Configuration

Add the watermark server URL to your main project's environment variables:

**In your main `.env` file:**
```env
VITE_PDF_WATERMARK_SERVER_URL=http://localhost:3002
```

**For production:**
```env
VITE_PDF_WATERMARK_SERVER_URL=https://your-watermark-server.com
```

### 5. Start the Server

**Using the batch script (Windows):**
```bash
# From project root
start-pdf-watermark-server.bat
```

**Manual start:**
```bash
cd server
npm start
```

**Development mode:**
```bash
cd server
npm run dev
```

## API Endpoints

### Download Protected PDF
```
GET /download-pdf/:magazineId?userId=:userId
```

**Parameters:**
- `magazineId`: ID of the magazine to download
- `userId`: ID of the user downloading (query parameter)

**Response:**
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="Magazine_Title_User_Name.pdf"`

Example:
```
GET http://localhost:3002/download-pdf/123e4567-e89b-12d3-a456-426614174000?userId=user123
```

### Health Check
```
GET /health
```

Returns server status and timestamp.

## Watermark Details

Each downloaded PDF includes:

1. **Center Watermark (Rotated -45°)**
   - User's full name and ID (first 8 characters)
   - Semi-transparent gray overlay

2. **Header Watermark**
   - User name and download timestamp
   - Small, discrete text at top of each page

3. **Footer Watermark** 
   - User ID (first 12 characters) and timestamp
   - Small text at bottom of each page

4. **Corner Watermark**
   - Copyright notice
   - Very discrete in bottom right corner

## Security Features

- **Access verification**: Checks user permissions before serving PDFs
- **Download logging**: Records all download attempts with metadata
- **IP tracking**: Logs IP addresses for security analysis
- **User agent tracking**: Records browser/client information
- **Unique filenames**: Each download has a unique filename with user info

## Download Logs

The system creates detailed logs in the `download_logs` table:

```sql
SELECT 
    u.full_name,
    m.title,
    dl.downloaded_at,
    dl.ip_address,
    dl.user_agent
FROM download_logs dl
JOIN users u ON dl.user_id = u.id  
JOIN magazines m ON dl.magazine_id = m.id
ORDER BY dl.downloaded_at DESC;
```

## Development

### File Structure
```
server/
├── pdf-watermark-server.js    # Main server file
├── package.json               # Dependencies
├── .env.example              # Environment template
└── .env                      # Your configuration (created by you)
```

### Dependencies
- `express`: Web server framework
- `cors`: Cross-origin resource sharing
- `pdf-lib`: PDF manipulation library
- `node-fetch`: HTTP client for fetching PDFs
- `@supabase/supabase-js`: Supabase client

### Error Handling

The server includes comprehensive error handling for:
- Missing user permissions
- Invalid magazine IDs
- PDF processing errors
- Network failures
- Database connection issues

### Monitoring

Monitor your watermarking system:
- Check `/health` endpoint regularly
- Monitor download logs for unusual activity
- Track server performance and PDF processing times
- Set up alerts for failed downloads

## Production Deployment

### Environment Variables
```env
NODE_ENV=production
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
PORT=3002
```

### SSL/HTTPS
Ensure your watermark server runs on HTTPS in production for security.

### Scaling
For high-volume usage, consider:
- Load balancing multiple server instances
- Caching frequently accessed PDFs
- Using a CDN for faster PDF delivery
- Database connection pooling

## Troubleshooting

### Common Issues

**Server won't start:**
- Check if port 3002 is available
- Verify Node.js is installed
- Check environment variables are set

**PDFs won't download:**
- Verify Supabase credentials
- Check user has access to the magazine  
- Ensure original PDF URLs are accessible

**Watermarks not appearing:**
- Check pdf-lib dependency is installed
- Verify PDF is not corrupted
- Check server logs for PDF processing errors

### Logs
Server logs include:
- Download attempts and successes
- PDF processing status
- Access verification results
- Error details and stack traces

## License

This PDF watermarking system is part of the New Era magazine platform.