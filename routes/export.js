const express = require('express');
const router = express.Router();
const CSVExporter = require('../utils/csvExporter');

// Export all data as CSV files in ZIP format
router.get('/csv', async (req, res) => {
    try {
        // Fetch all data from database
        const accounts = await req.db.getAllAccounts();
        const contacts = await req.db.getAllContacts();
        const communications = await req.db.getAllCommunications();
        const opportunities = await req.db.getAllOpportunities();

        // Generate ZIP file with CSV data
        const zipBuffer = await CSVExporter.createExportZip(
            accounts, 
            contacts, 
            communications, 
            opportunities
        );

        // Set response headers for file download
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `CRM_Data_Export_${timestamp}.zip`;
        
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', zipBuffer.length);

        // Send the ZIP file
        res.send(zipBuffer);

    } catch (error) {
        console.error('Export failed:', error);
        res.status(500).json({ 
            error: 'Failed to generate export file',
            details: error.message 
        });
    }
});

// Generate and download sample CSV template
router.get('/sample', async (req, res) => {
    try {
        // Generate sample template ZIP
        const zipBuffer = await CSVExporter.createSampleTemplate();

        // Set response headers for file download
        const filename = 'CRM_Import_Template.zip';
        
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', zipBuffer.length);

        // Send the template ZIP file
        res.send(zipBuffer);

    } catch (error) {
        console.error('Sample template generation failed:', error);
        res.status(500).json({ 
            error: 'Failed to generate sample template',
            details: error.message 
        });
    }
});

module.exports = router;