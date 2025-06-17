const express = require('express');
const router = express.Router();

// GET /api/accounts - List all accounts
router.get('/', async (req, res) => {
    try {
        const accounts = await req.db.getAllAccounts();
        res.json(accounts);
    } catch (error) {
        console.error('Error fetching accounts:', error);
        res.status(500).json({ error: 'Failed to fetch accounts' });
    }
});

// POST /api/accounts - Create new account
router.post('/', async (req, res) => {
    try {
        // Check for duplicate company names
        const duplicates = await req.db.checkDuplicateAccount(req.body.company_name);
        if (duplicates.length > 0) {
            return res.status(409).json({ 
                error: 'Similar company names already exist', 
                duplicates: duplicates 
            });
        }

        const account = await req.db.createAccount(req.body);
        res.status(201).json(account);
    } catch (error) {
        console.error('Error creating account:', error);
        res.status(500).json({ error: 'Failed to create account' });
    }
});

// GET /api/accounts/:id - Get specific account
router.get('/:id', async (req, res) => {
    try {
        const account = await req.db.getAccount(req.params.id);
        if (!account) {
            return res.status(404).json({ error: 'Account not found' });
        }
        res.json(account);
    } catch (error) {
        console.error('Error fetching account:', error);
        res.status(500).json({ error: 'Failed to fetch account' });
    }
});

// PUT /api/accounts/:id - Update account
router.put('/:id', async (req, res) => {
    try {
        const account = await req.db.updateAccount(req.params.id, req.body);
        if (!account) {
            return res.status(404).json({ error: 'Account not found' });
        }
        res.json(account);
    } catch (error) {
        console.error('Error updating account:', error);
        res.status(500).json({ error: 'Failed to update account' });
    }
});

// DELETE /api/accounts/:id - Delete account
router.delete('/:id', async (req, res) => {
    try {
        const result = await req.db.deleteAccount(req.params.id);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Account not found' });
        }
        res.json({ message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).json({ error: 'Failed to delete account' });
    }
});

module.exports = router;