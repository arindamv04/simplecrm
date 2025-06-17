const express = require('express');
const router = express.Router();

// GET /api/opportunities - List all opportunities
router.get('/', async (req, res) => {
    try {
        const { account_id } = req.query;
        let opportunities;
        
        if (account_id) {
            opportunities = await req.db.getOpportunitiesByAccount(account_id);
        } else {
            opportunities = await req.db.getAllOpportunities();
        }
        
        res.json(opportunities);
    } catch (error) {
        console.error('Error fetching opportunities:', error);
        res.status(500).json({ error: 'Failed to fetch opportunities' });
    }
});

// POST /api/opportunities - Create new opportunity
router.post('/', async (req, res) => {
    try {
        // Validate that account exists
        const account = await req.db.getAccount(req.body.account_id);
        if (!account) {
            return res.status(400).json({ error: 'Account not found' });
        }

        const opportunity = await req.db.createOpportunity(req.body);
        res.status(201).json(opportunity);
    } catch (error) {
        console.error('Error creating opportunity:', error);
        res.status(500).json({ error: 'Failed to create opportunity' });
    }
});

// GET /api/opportunities/:id - Get specific opportunity
router.get('/:id', async (req, res) => {
    try {
        const opportunity = await req.db.getOpportunity(req.params.id);
        if (!opportunity) {
            return res.status(404).json({ error: 'Opportunity not found' });
        }
        res.json(opportunity);
    } catch (error) {
        console.error('Error fetching opportunity:', error);
        res.status(500).json({ error: 'Failed to fetch opportunity' });
    }
});

// PUT /api/opportunities/:id - Update opportunity
router.put('/:id', async (req, res) => {
    try {
        // Validate that account exists if account_id is being updated
        if (req.body.account_id) {
            const account = await req.db.getAccount(req.body.account_id);
            if (!account) {
                return res.status(400).json({ error: 'Account not found' });
            }
        }

        const opportunity = await req.db.updateOpportunity(req.params.id, req.body);
        if (!opportunity) {
            return res.status(404).json({ error: 'Opportunity not found' });
        }
        res.json(opportunity);
    } catch (error) {
        console.error('Error updating opportunity:', error);
        res.status(500).json({ error: 'Failed to update opportunity' });
    }
});

// DELETE /api/opportunities/:id - Delete opportunity
router.delete('/:id', async (req, res) => {
    try {
        const result = await req.db.deleteOpportunity(req.params.id);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Opportunity not found' });
        }
        res.json({ message: 'Opportunity deleted successfully' });
    } catch (error) {
        console.error('Error deleting opportunity:', error);
        res.status(500).json({ error: 'Failed to delete opportunity' });
    }
});

module.exports = router;