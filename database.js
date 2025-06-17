const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
    constructor() {
        this.db = null;
        this.init();
    }

    init() {
        const dbPath = path.join(__dirname, 'pcb_crm.db');
        this.db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
            } else {
                console.log('Connected to SQLite database');
                this.createTables();
            }
        });
    }

    createTables() {
        const tables = [
            `CREATE TABLE IF NOT EXISTS accounts (
                account_id TEXT PRIMARY KEY,
                company_name TEXT NOT NULL,
                industry TEXT,
                company_size TEXT,
                location TEXT,
                website TEXT,
                account_status TEXT DEFAULT 'Prospect',
                source TEXT,
                revenue_potential REAL,
                decision_timeline TEXT,
                technical_requirements TEXT,
                current_supplier TEXT,
                account_owner TEXT,
                last_contact DATE,
                next_followup DATE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS contacts (
                contact_id TEXT PRIMARY KEY,
                account_id TEXT,
                first_name TEXT,
                last_name TEXT,
                title TEXT,
                email TEXT,
                phone TEXT,
                primary_contact BOOLEAN DEFAULT 0,
                decision_maker BOOLEAN DEFAULT 0,
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (account_id) REFERENCES accounts(account_id)
            )`,
            
            `CREATE TABLE IF NOT EXISTS communications (
                comm_id TEXT PRIMARY KEY,
                account_id TEXT,
                contact_id TEXT,
                comm_date DATE,
                comm_type TEXT,
                direction TEXT,
                subject TEXT,
                summary TEXT,
                next_steps TEXT,
                followup_required BOOLEAN DEFAULT 0,
                followup_date DATE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (account_id) REFERENCES accounts(account_id),
                FOREIGN KEY (contact_id) REFERENCES contacts(contact_id)
            )`,
            
            `CREATE TABLE IF NOT EXISTS opportunities (
                opp_id TEXT PRIMARY KEY,
                account_id TEXT,
                opp_name TEXT,
                stage TEXT,
                value REAL,
                probability INTEGER,
                expected_close DATE,
                requirements TEXT,
                competition TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (account_id) REFERENCES accounts(account_id)
            )`
        ];

        tables.forEach((tableSQL, index) => {
            this.db.run(tableSQL, (err) => {
                if (err) {
                    console.error(`Error creating table ${index + 1}:`, err.message);
                } else {
                    console.log(`Table ${index + 1} created successfully`);
                }
            });
        });
    }

    generateId(prefix) {
        const timestamp = Date.now().toString();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${prefix}${timestamp.slice(-6)}${random}`;
    }

    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err.message);
                } else {
                    console.log('Database connection closed');
                }
            });
        }
    }

    // Generic method to run queries with promises
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Account CRUD operations
    async createAccount(accountData) {
        const accountId = this.generateId('A');
        const sql = `INSERT INTO accounts (
            account_id, company_name, industry, company_size, location, website,
            account_status, source, revenue_potential, decision_timeline,
            technical_requirements, current_supplier, account_owner, last_contact, next_followup
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        
        const params = [
            accountId, accountData.company_name, accountData.industry,
            accountData.company_size, accountData.location, accountData.website,
            accountData.account_status || 'Prospect', accountData.source,
            accountData.revenue_potential, accountData.decision_timeline,
            accountData.technical_requirements, accountData.current_supplier,
            accountData.account_owner, accountData.last_contact, accountData.next_followup
        ];
        
        await this.run(sql, params);
        return this.getAccount(accountId);
    }

    async getAccount(accountId) {
        const sql = 'SELECT * FROM accounts WHERE account_id = ?';
        return await this.get(sql, [accountId]);
    }

    async getAllAccounts() {
        const sql = 'SELECT * FROM accounts ORDER BY created_at DESC';
        return await this.all(sql);
    }

    async updateAccount(accountId, accountData) {
        const sql = `UPDATE accounts SET 
            company_name = ?, industry = ?, company_size = ?, location = ?, website = ?,
            account_status = ?, source = ?, revenue_potential = ?, decision_timeline = ?,
            technical_requirements = ?, current_supplier = ?, account_owner = ?,
            last_contact = ?, next_followup = ?, updated_at = CURRENT_TIMESTAMP
            WHERE account_id = ?`;
        
        const params = [
            accountData.company_name, accountData.industry, accountData.company_size,
            accountData.location, accountData.website, accountData.account_status,
            accountData.source, accountData.revenue_potential, accountData.decision_timeline,
            accountData.technical_requirements, accountData.current_supplier,
            accountData.account_owner, accountData.last_contact, accountData.next_followup,
            accountId
        ];
        
        await this.run(sql, params);
        return this.getAccount(accountId);
    }

    async deleteAccount(accountId) {
        const sql = 'DELETE FROM accounts WHERE account_id = ?';
        return await this.run(sql, [accountId]);
    }

    // Contact CRUD operations
    async createContact(contactData) {
        const contactId = this.generateId('C');
        const sql = `INSERT INTO contacts (
            contact_id, account_id, first_name, last_name, title, email, phone,
            primary_contact, decision_maker, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        
        const params = [
            contactId, contactData.account_id, contactData.first_name,
            contactData.last_name, contactData.title, contactData.email,
            contactData.phone, contactData.primary_contact || 0,
            contactData.decision_maker || 0, contactData.notes
        ];
        
        await this.run(sql, params);
        return this.getContact(contactId);
    }

    async getContact(contactId) {
        const sql = 'SELECT * FROM contacts WHERE contact_id = ?';
        return await this.get(sql, [contactId]);
    }

    async getAllContacts() {
        const sql = 'SELECT * FROM contacts ORDER BY created_at DESC';
        return await this.all(sql);
    }

    async getContactsByAccount(accountId) {
        const sql = 'SELECT * FROM contacts WHERE account_id = ? ORDER BY primary_contact DESC, created_at DESC';
        return await this.all(sql, [accountId]);
    }

    async updateContact(contactId, contactData) {
        const sql = `UPDATE contacts SET 
            account_id = ?, first_name = ?, last_name = ?, title = ?, email = ?, phone = ?,
            primary_contact = ?, decision_maker = ?, notes = ?
            WHERE contact_id = ?`;
        
        const params = [
            contactData.account_id, contactData.first_name, contactData.last_name,
            contactData.title, contactData.email, contactData.phone,
            contactData.primary_contact, contactData.decision_maker, contactData.notes,
            contactId
        ];
        
        await this.run(sql, params);
        return this.getContact(contactId);
    }

    async deleteContact(contactId) {
        const sql = 'DELETE FROM contacts WHERE contact_id = ?';
        return await this.run(sql, [contactId]);
    }

    // Communication CRUD operations
    async createCommunication(commData) {
        const commId = this.generateId('COM');
        const sql = `INSERT INTO communications (
            comm_id, account_id, contact_id, comm_date, comm_type, direction,
            subject, summary, next_steps, followup_required, followup_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        
        const params = [
            commId, commData.account_id, commData.contact_id, commData.comm_date,
            commData.comm_type, commData.direction, commData.subject,
            commData.summary, commData.next_steps, commData.followup_required || 0,
            commData.followup_date
        ];
        
        await this.run(sql, params);
        return this.getCommunication(commId);
    }

    async getCommunication(commId) {
        const sql = 'SELECT * FROM communications WHERE comm_id = ?';
        return await this.get(sql, [commId]);
    }

    async getAllCommunications() {
        const sql = 'SELECT * FROM communications ORDER BY comm_date DESC';
        return await this.all(sql);
    }

    async getCommunicationsByAccount(accountId) {
        const sql = 'SELECT * FROM communications WHERE account_id = ? ORDER BY comm_date DESC';
        return await this.all(sql, [accountId]);
    }

    async updateCommunication(commId, commData) {
        const sql = `UPDATE communications SET 
            account_id = ?, contact_id = ?, comm_date = ?, comm_type = ?, direction = ?,
            subject = ?, summary = ?, next_steps = ?, followup_required = ?, followup_date = ?
            WHERE comm_id = ?`;
        
        const params = [
            commData.account_id, commData.contact_id, commData.comm_date,
            commData.comm_type, commData.direction, commData.subject,
            commData.summary, commData.next_steps, commData.followup_required,
            commData.followup_date, commId
        ];
        
        await this.run(sql, params);
        return this.getCommunication(commId);
    }

    async deleteCommunication(commId) {
        const sql = 'DELETE FROM communications WHERE comm_id = ?';
        return await this.run(sql, [commId]);
    }

    // Opportunity CRUD operations
    async createOpportunity(oppData) {
        const oppId = this.generateId('OPP');
        const sql = `INSERT INTO opportunities (
            opp_id, account_id, opp_name, stage, value, probability,
            expected_close, requirements, competition
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        
        const params = [
            oppId, oppData.account_id, oppData.opp_name, oppData.stage,
            oppData.value, oppData.probability, oppData.expected_close,
            oppData.requirements, oppData.competition
        ];
        
        await this.run(sql, params);
        return this.getOpportunity(oppId);
    }

    async getOpportunity(oppId) {
        const sql = 'SELECT * FROM opportunities WHERE opp_id = ?';
        return await this.get(sql, [oppId]);
    }

    async getAllOpportunities() {
        const sql = 'SELECT * FROM opportunities ORDER BY created_at DESC';
        return await this.all(sql);
    }

    async getOpportunitiesByAccount(accountId) {
        const sql = 'SELECT * FROM opportunities WHERE account_id = ? ORDER BY created_at DESC';
        return await this.all(sql, [accountId]);
    }

    async updateOpportunity(oppId, oppData) {
        const sql = `UPDATE opportunities SET 
            account_id = ?, opp_name = ?, stage = ?, value = ?, probability = ?,
            expected_close = ?, requirements = ?, competition = ?
            WHERE opp_id = ?`;
        
        const params = [
            oppData.account_id, oppData.opp_name, oppData.stage, oppData.value,
            oppData.probability, oppData.expected_close, oppData.requirements,
            oppData.competition, oppId
        ];
        
        await this.run(sql, params);
        return this.getOpportunity(oppId);
    }

    async deleteOpportunity(oppId) {
        const sql = 'DELETE FROM opportunities WHERE opp_id = ?';
        return await this.run(sql, [oppId]);
    }

    // Duplicate detection
    async checkDuplicateAccount(companyName) {
        const sql = 'SELECT account_id, company_name FROM accounts WHERE LOWER(company_name) LIKE LOWER(?)';
        return await this.all(sql, [`%${companyName}%`]);
    }

    // Dashboard statistics
    async getDashboardStats() {
        const stats = {};
        
        stats.totalAccounts = await this.get('SELECT COUNT(*) as count FROM accounts');
        stats.totalContacts = await this.get('SELECT COUNT(*) as count FROM contacts');
        stats.totalOpportunities = await this.get('SELECT COUNT(*) as count FROM opportunities');
        stats.totalCommunications = await this.get('SELECT COUNT(*) as count FROM communications');
        
        stats.accountsByStatus = await this.all(`
            SELECT account_status, COUNT(*) as count 
            FROM accounts 
            GROUP BY account_status
        `);
        
        stats.opportunitiesByStage = await this.all(`
            SELECT stage, COUNT(*) as count, SUM(value) as total_value
            FROM opportunities 
            GROUP BY stage
        `);
        
        return stats;
    }

    // Search functionality
    async search(query) {
        const searchTerm = `%${query}%`;
        const results = {
            accounts: [],
            contacts: [],
            communications: [],
            opportunities: []
        };

        results.accounts = await this.all(`
            SELECT * FROM accounts 
            WHERE company_name LIKE ? OR industry LIKE ? OR location LIKE ?
        `, [searchTerm, searchTerm, searchTerm]);

        results.contacts = await this.all(`
            SELECT * FROM contacts 
            WHERE first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR title LIKE ?
        `, [searchTerm, searchTerm, searchTerm, searchTerm]);

        results.communications = await this.all(`
            SELECT * FROM communications 
            WHERE subject LIKE ? OR summary LIKE ?
        `, [searchTerm, searchTerm]);

        results.opportunities = await this.all(`
            SELECT * FROM opportunities 
            WHERE opp_name LIKE ? OR requirements LIKE ?
        `, [searchTerm, searchTerm]);

        return results;
    }
}

module.exports = Database;