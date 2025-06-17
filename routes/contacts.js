const express = require('express');
const router = express.Router();

// GET /api/contacts - List all contacts
router.get('/', async (req, res) => {
    try {
        const { account_id } = req.query;
        let contacts;
        
        if (account_id) {
            contacts = await req.db.getContactsByAccount(account_id);
        } else {
            contacts = await req.db.getAllContacts();
        }
        
        res.json(contacts);
    } catch (error) {
        console.error('Error fetching contacts:', error);
        res.status(500).json({ error: 'Failed to fetch contacts' });
    }
});

// POST /api/contacts - Create new contact
router.post('/', async (req, res) => {
    try {
        // Validate that account exists
        const account = await req.db.getAccount(req.body.account_id);
        if (!account) {
            return res.status(400).json({ error: 'Account not found' });
        }

        const contact = await req.db.createContact(req.body);
        res.status(201).json(contact);
    } catch (error) {
        console.error('Error creating contact:', error);
        res.status(500).json({ error: 'Failed to create contact' });
    }
});

// GET /api/contacts/:id - Get specific contact
router.get('/:id', async (req, res) => {
    try {
        const contact = await req.db.getContact(req.params.id);
        if (!contact) {
            return res.status(404).json({ error: 'Contact not found' });
        }
        res.json(contact);
    } catch (error) {
        console.error('Error fetching contact:', error);
        res.status(500).json({ error: 'Failed to fetch contact' });
    }
});

// PUT /api/contacts/:id - Update contact
router.put('/:id', async (req, res) => {
    try {
        // Validate that account exists if account_id is being updated
        if (req.body.account_id) {
            const account = await req.db.getAccount(req.body.account_id);
            if (!account) {
                return res.status(400).json({ error: 'Account not found' });
            }
        }

        const contact = await req.db.updateContact(req.params.id, req.body);
        if (!contact) {
            return res.status(404).json({ error: 'Contact not found' });
        }
        res.json(contact);
    } catch (error) {
        console.error('Error updating contact:', error);
        res.status(500).json({ error: 'Failed to update contact' });
    }
});

// DELETE /api/contacts/:id - Delete contact
router.delete('/:id', async (req, res) => {
    try {
        const result = await req.db.deleteContact(req.params.id);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Contact not found' });
        }
        res.json({ message: 'Contact deleted successfully' });
    } catch (error) {
        console.error('Error deleting contact:', error);
        res.status(500).json({ error: 'Failed to delete contact' });
    }
});

module.exports = router;