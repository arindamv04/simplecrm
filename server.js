const express = require('express');
const cors = require('cors');
const path = require('path');
const Database = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
const db = new Database();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database middleware
app.use((req, res, next) => {
    req.db = db;
    next();
});

// Import routes
const accountsRouter = require('./routes/accounts');
const contactsRouter = require('./routes/contacts');
const communicationsRouter = require('./routes/communications');
const opportunitiesRouter = require('./routes/opportunities');

// API routes
app.use('/api/accounts', accountsRouter);
app.use('/api/contacts', contactsRouter);
app.use('/api/communications', communicationsRouter);
app.use('/api/opportunities', opportunitiesRouter);

// Dashboard statistics endpoint
app.get('/api/dashboard', async (req, res) => {
    try {
        const stats = await db.getDashboardStats();
        res.json(stats);
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
    }
});

// Search endpoint
app.get('/api/search', async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }
        
        const results = await db.search(query);
        res.json(results);
    } catch (error) {
        console.error('Error performing search:', error);
        res.status(500).json({ error: 'Failed to perform search' });
    }
});

// Basic route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`PCB CRM server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to access the application`);
});