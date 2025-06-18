const express = require('express');
const multer = require('multer');
const router = express.Router();
const CSVImporter = require('../utils/csvImporter');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept CSV and ZIP files only
        if (file.mimetype === 'text/csv' || 
            file.mimetype === 'application/zip' ||
            file.mimetype === 'application/x-zip-compressed' ||
            file.originalname.endsWith('.csv') ||
            file.originalname.endsWith('.zip')) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV and ZIP files are allowed'), false);
        }
    }
});

// Import data from uploaded CSV or ZIP file
router.post('/csv', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                error: 'No file uploaded',
                details: 'Please select a CSV or ZIP file to upload'
            });
        }

        // Create importer instance
        const importer = new CSVImporter();

        // Process the uploaded file
        const results = await importer.processImport(
            req.file.buffer,
            req.file.originalname,
            req.db
        );

        // Return results
        if (results.success) {
            res.json({
                success: true,
                message: 'Import completed successfully',
                imported: results.imported,
                warnings: results.warnings
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Import failed with validation errors',
                errors: results.errors,
                warnings: results.warnings,
                imported: results.imported
            });
        }

    } catch (error) {
        console.error('Import failed:', error);
        
        // Handle specific multer errors
        if (error instanceof multer.MulterError) {
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    error: 'File too large',
                    details: 'File size must be less than 10MB'
                });
            }
        }

        res.status(500).json({ 
            error: 'Import failed',
            details: error.message 
        });
    }
});

// Validate uploaded file without importing
router.post('/validate', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                error: 'No file uploaded',
                details: 'Please select a CSV or ZIP file to validate'
            });
        }

        // Create importer instance for validation only
        const importer = new CSVImporter();

        // Extract and validate file contents without importing to database
        let files = {};
        
        if (req.file.originalname.endsWith('.zip')) {
            files = await importer.extractFromZip(req.file.buffer);
        } else if (req.file.originalname.endsWith('.csv')) {
            const content = req.file.buffer.toString('utf8');
            files[req.file.originalname] = content;
        }

        const validationResults = [];
        
        // Validate each file
        for (const [fileName, content] of Object.entries(files)) {
            try {
                const { headers, data } = CSVImporter.parseCSV(content);
                const dataType = importer.determineDataType(fileName, headers);
                
                if (dataType) {
                    const errors = importer.validateData(data, dataType);
                    validationResults.push({
                        filename: fileName,
                        dataType: dataType,
                        recordCount: data.length,
                        valid: errors.length === 0,
                        errors: errors
                    });
                } else {
                    validationResults.push({
                        filename: fileName,
                        dataType: 'unknown',
                        recordCount: 0,
                        valid: false,
                        errors: ['Could not determine data type from filename or headers']
                    });
                }
            } catch (error) {
                validationResults.push({
                    filename: fileName,
                    dataType: 'error',
                    recordCount: 0,
                    valid: false,
                    errors: [error.message]
                });
            }
        }

        res.json({
            success: true,
            message: 'File validation completed',
            results: validationResults
        });

    } catch (error) {
        console.error('Validation failed:', error);
        res.status(500).json({ 
            error: 'Validation failed',
            details: error.message 
        });
    }
});

module.exports = router;