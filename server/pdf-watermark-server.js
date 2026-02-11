import express from 'express';
import cors from 'cors';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(cors());
app.use(express.json());

// Supabase client setup
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Add watermark to PDF with user information
 * @param {Buffer} pdfBuffer - Original PDF buffer
 * @param {Object} userInfo - User information for watermark
 * @returns {Buffer} - Watermarked PDF buffer
 */
async function addWatermarkToPDF(pdfBuffer, userInfo) {
    try {
        // Load the existing PDF
        const pdfDoc = await PDFDocument.load(pdfBuffer);
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const pages = pdfDoc.getPages();

        // Watermark text with user info and timestamp
        const timestamp = new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'UTC'
        });

        const watermarkText = [
            `Licensed to: ${userInfo.full_name}`,
            `User ID: ${userInfo.id}`,
            `Email: ${userInfo.email || 'N/A'}`,
            `Downloaded: ${timestamp} UTC`,
            `© New Era - Unauthorized sharing prohibited`
        ];

        // Add watermark to each page
        pages.forEach((page, pageIndex) => {
            const { width, height } = page.getSize();
            
            // Semi-transparent watermark in the center
            const centerX = width / 2;
            const centerY = height / 2;

            // Main watermark (rotated)
            page.drawText(`Licensed to: ${userInfo.full_name} (ID: ${userInfo.id.slice(0, 8)})`, {
                x: centerX - 150,
                y: centerY,
                size: 20,
                font: helveticaFont,
                color: rgb(0.7, 0.7, 0.7),
                opacity: 0.3,
                rotate: { type: 'degrees', angle: -45 }
            });

            // Header watermark (small, discrete)
            page.drawText(`${userInfo.full_name} - ${timestamp}`, {
                x: 20,
                y: height - 30,
                size: 8,
                font: helveticaFont,
                color: rgb(0.5, 0.5, 0.5),
                opacity: 0.8
            });

            // Footer watermark (discrete)
            page.drawText(`User: ${userInfo.id.slice(0, 12)} | Download: ${timestamp} UTC`, {
                x: 20,
                y: 15,
                size: 7,
                font: helveticaFont,
                color: rgb(0.4, 0.4, 0.4),
                opacity: 0.9
            });

            // Corner watermark (very discrete)
            page.drawText(`© New Era`, {
                x: width - 80,
                y: 15,
                size: 6,
                font: helveticaFont,
                color: rgb(0.6, 0.6, 0.6),
                opacity: 0.7
            });
        });

        // Save the watermarked PDF
        const watermarkedPdfBytes = await pdfDoc.save();
        return Buffer.from(watermarkedPdfBytes);

    } catch (error) {
        console.error('Error adding watermark to PDF:', error);
        throw new Error('Failed to add watermark to PDF');
    }
}

/**
 * Verify user has access to the magazine
 * @param {string} userId - User ID
 * @param {string} magazineId - Magazine ID
 * @returns {boolean} - Whether user has access
 */
async function verifyUserAccess(userId, magazineId) {
    try {
        // Check if magazine is free
        const { data: magazine, error: magError } = await supabase
            .from('magazines')
            .select('is_paid, id')
            .eq('id', magazineId)
            .single();

        if (magError) {
            console.error('Error fetching magazine:', magError);
            return false;
        }

        // If magazine is free, allow access
        if (!magazine.is_paid) {
            return true;
        }

        // For paid magazines, check if user has access granted
        const { data: access, error: accessError } = await supabase
            .from('magazine_access')
            .select('id')
            .eq('user_id', userId)
            .eq('magazine_id', magazineId)
            .single();

        if (accessError && accessError.code !== 'PGRST116') {
            console.error('Error checking access:', accessError);
            return false;
        }

        return !!access;

    } catch (error) {
        console.error('Error verifying user access:', error);
        return false;
    }
}

/**
 * Log download activity for tracking
 * @param {string} userId - User ID
 * @param {string} magazineId - Magazine ID
 * @param {string} userAgent - User agent string
 * @param {string} ipAddress - IP address
 */
async function logDownloadActivity(userId, magazineId, userAgent, ipAddress) {
    try {
        await supabase.from('download_logs').insert([{
            user_id: userId,
            magazine_id: magazineId,
            downloaded_at: new Date().toISOString(),
            user_agent: userAgent,
            ip_address: ipAddress
        }]);
    } catch (error) {
        console.error('Error logging download activity:', error);
        // Don't throw error here as it's just logging
    }
}

// Main endpoint for downloading watermarked PDFs
app.get('/download-pdf/:magazineId', async (req, res) => {
    try {
        const { magazineId } = req.params;
        const { userId } = req.query;

        // Validate required parameters
        if (!userId || !magazineId) {
            return res.status(400).json({ 
                error: 'Missing required parameters: userId and magazineId' 
            });
        }

        // Get user information
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id, full_name, email')
            .eq('id', userId)
            .single();

        if (userError || !user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify user has access to this magazine
        const hasAccess = await verifyUserAccess(userId, magazineId);
        if (!hasAccess) {
            return res.status(403).json({ 
                error: 'Access denied. User does not have permission to download this magazine.' 
            });
        }

        // Get magazine information and PDF URL
        const { data: magazine, error: magError } = await supabase
            .from('magazines')
            .select('id, title, pdf_url')
            .eq('id', magazineId)
            .single();

        if (magError || !magazine || !magazine.pdf_url) {
            return res.status(404).json({ error: 'Magazine or PDF not found' });
        }

        // Fetch the original PDF
        console.log('Fetching PDF from:', magazine.pdf_url);
        const pdfResponse = await fetch(magazine.pdf_url);
        
        if (!pdfResponse.ok) {
            throw new Error(`Failed to fetch PDF: ${pdfResponse.status} ${pdfResponse.statusText}`);
        }

        const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());

        // Add watermark with user information
        const watermarkedPdf = await addWatermarkToPDF(pdfBuffer, {
            id: user.id,
            full_name: user.full_name,
            email: user.email
        });

        // Log the download activity
        const userAgent = req.get('User-Agent') || 'Unknown';
        const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown';
        await logDownloadActivity(userId, magazineId, userAgent, ipAddress);

        // Set response headers
        const filename = `${magazine.title.replace(/[^a-zA-Z0-9]/g, '_')}_${user.full_name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', watermarkedPdf.length);

        // Send the watermarked PDF
        res.send(watermarkedPdf);

        console.log(`PDF downloaded successfully by user ${user.full_name} (${userId}) for magazine ${magazine.title}`);

    } catch (error) {
        console.error('Error serving watermarked PDF:', error);
        res.status(500).json({ 
            error: 'Internal server error while processing PDF',
            message: error.message 
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        service: 'PDF Watermark Service',
        timestamp: new Date().toISOString()
    });
});

// Start server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`🔒 PDF Watermark Server running on port ${PORT}`);
    console.log(`📚 Ready to serve protected magazine downloads`);
});

export default app;