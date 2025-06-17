const express = require('express');
const router = express.Router();

// GET /api/communications - List all communications
router.get('/', async (req, res) => {
    try {
        const { account_id } = req.query;
        let communications;
        
        if (account_id) {
            communications = await req.db.getCommunicationsByAccount(account_id);
        } else {
            communications = await req.db.getAllCommunications();
        }
        
        res.json(communications);
    } catch (error) {
        console.error('Error fetching communications:', error);
        res.status(500).json({ error: 'Failed to fetch communications' });
    }
});

// POST /api/communications - Create new communication
router.post('/', async (req, res) => {
    try {
        // Validate that account exists
        const account = await req.db.getAccount(req.body.account_id);
        if (!account) {
            return res.status(400).json({ error: 'Account not found' });
        }

        // Validate contact if provided
        if (req.body.contact_id) {
            const contact = await req.db.getContact(req.body.contact_id);
            if (!contact) {
                return res.status(400).json({ error: 'Contact not found' });
            }
        }

        const communication = await req.db.createCommunication(req.body);
        res.status(201).json(communication);
    } catch (error) {
        console.error('Error creating communication:', error);
        res.status(500).json({ error: 'Failed to create communication' });
    }
});

// GET /api/communications/:id - Get specific communication
router.get('/:id', async (req, res) => {
    try {
        const communication = await req.db.getCommunication(req.params.id);
        if (!communication) {
            return res.status(404).json({ error: 'Communication not found' });
        }
        res.json(communication);
    } catch (error) {
        console.error('Error fetching communication:', error);
        res.status(500).json({ error: 'Failed to fetch communication' });
    }
});

// PUT /api/communications/:id - Update communication
router.put('/:id', async (req, res) => {
    try {
        // Validate that account exists if account_id is being updated
        if (req.body.account_id) {
            const account = await req.db.getAccount(req.body.account_id);
            if (!account) {
                return res.status(400).json({ error: 'Account not found' });
            }
        }

        // Validate contact if provided
        if (req.body.contact_id) {
            const contact = await req.db.getContact(req.body.contact_id);
            if (!contact) {
                return res.status(400).json({ error: 'Contact not found' });
            }
        }

        const communication = await req.db.updateCommunication(req.params.id, req.body);
        if (!communication) {
            return res.status(404).json({ error: 'Communication not found' });
        }
        res.json(communication);
    } catch (error) {
        console.error('Error updating communication:', error);
        res.status(500).json({ error: 'Failed to update communication' });
    }
});

// DELETE /api/communications/:id - Delete communication
router.delete('/:id', async (req, res) => {
    try {
        const result = await req.db.deleteCommunication(req.params.id);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Communication not found' });
        }
        res.json({ message: 'Communication deleted successfully' });
    } catch (error) {
        console.error('Error deleting communication:', error);
        res.status(500).json({ error: 'Failed to delete communication' });
    }
});

module.exports = router;