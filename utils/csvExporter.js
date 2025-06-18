const JSZip = require('jszip');

class CSVExporter {
    // Convert array of objects to CSV string
    static arrayToCSV(data, headers) {
        if (!data || data.length === 0) {
            return headers.join(',') + '\n';
        }

        // Create header row
        let csv = headers.join(',') + '\n';

        // Add data rows
        data.forEach(row => {
            const values = headers.map(header => {
                const field = CSVExporter.getFieldNameFromHeader(header);
                let value = row[field] || '';
                
                // Handle different data types
                if (value === null || value === undefined) {
                    value = '';
                } else if (typeof value === 'string') {
                    // Escape quotes and wrap in quotes if contains comma, quote, or newline
                    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                        value = '"' + value.replace(/"/g, '""') + '"';
                    }
                } else if (typeof value === 'boolean') {
                    value = value ? 'TRUE' : 'FALSE';
                } else {
                    value = String(value);
                }
                
                return value;
            });
            csv += values.join(',') + '\n';
        });

        return csv;
    }

    // Convert header display name to database field name
    static getFieldNameFromHeader(header) {
        const fieldMapping = {
            // Accounts (unchanged - primary entities)
            'Company Name': 'company_name',
            'Industry': 'industry',
            'Company Size': 'company_size',
            'Location': 'location',
            'Website': 'website',
            'Account Status': 'account_status',
            'Source': 'source',
            'Revenue Potential': 'revenue_potential',
            'Decision Timeline': 'decision_timeline',
            'Technical Requirements': 'technical_requirements',
            'Current Supplier': 'current_supplier',
            'Account Owner': 'account_owner',
            'Last Contact': 'last_contact',
            'Next Followup': 'next_followup',
            'Created At': 'created_at',
            'Updated At': 'updated_at',

            // Contacts (use Company Name instead of Account ID)
            'First Name': 'first_name',
            'Last Name': 'last_name',
            'Title': 'title',
            'Email': 'email',
            'Phone': 'phone',
            'Primary Contact': 'primary_contact',
            'Decision Maker': 'decision_maker',
            'Notes': 'notes',

            // Communications (use natural identifiers)
            'Contact First Name': 'contact_first_name',
            'Contact Last Name': 'contact_last_name',
            'Communication Date': 'comm_date',
            'Communication Type': 'comm_type',
            'Direction': 'direction',
            'Subject': 'subject',
            'Summary': 'summary',
            'Next Steps': 'next_steps',
            'Followup Required': 'followup_required',
            'Followup Date': 'followup_date',

            // Opportunities (use Company Name instead of Account ID)
            'Opportunity Name': 'opp_name',
            'Stage': 'stage',
            'Value': 'value',
            'Probability': 'probability',
            'Expected Close': 'expected_close',
            'Requirements': 'requirements',
            'Competition': 'competition'
        };

        return fieldMapping[header] || header.toLowerCase().replace(/\s+/g, '_');
    }

    // Generate accounts CSV
    static generateAccountsCSV(accounts) {
        const headers = [
            'Company Name', 'Industry', 'Company Size', 
            'Location', 'Website', 'Account Status', 'Source', 
            'Revenue Potential', 'Decision Timeline', 'Technical Requirements',
            'Current Supplier', 'Account Owner', 'Last Contact', 
            'Next Followup', 'Created At', 'Updated At'
        ];

        return this.arrayToCSV(accounts, headers);
    }

    // Generate contacts CSV with company names
    static generateContactsCSV(contacts, accounts) {
        const headers = [
            'Company Name', 'First Name', 'Last Name', 'Title', 
            'Email', 'Phone', 'Primary Contact', 'Decision Maker', 'Notes', 'Created At'
        ];

        // Enrich contacts with company names
        const enrichedContacts = contacts.map(contact => {
            const account = accounts.find(acc => String(acc.account_id) === String(contact.account_id));
            return {
                ...contact,
                company_name: account ? account.company_name : 'Unknown Company'
            };
        });

        return this.arrayToCSV(enrichedContacts, headers);
    }

    // Generate communications CSV with company and contact names
    static generateCommunicationsCSV(communications, accounts, contacts) {
        const headers = [
            'Company Name', 'Contact First Name', 'Contact Last Name', 'Communication Date', 
            'Communication Type', 'Direction', 'Subject', 'Summary', 'Next Steps', 
            'Followup Required', 'Followup Date', 'Created At'
        ];

        // Enrich communications with company and contact names
        const enrichedCommunications = communications.map(comm => {
            const account = accounts.find(acc => String(acc.account_id) === String(comm.account_id));
            const contact = contacts.find(cont => String(cont.contact_id) === String(comm.contact_id));
            
            return {
                ...comm,
                company_name: account ? account.company_name : 'Unknown Company',
                contact_first_name: contact ? contact.first_name : '',
                contact_last_name: contact ? contact.last_name : ''
            };
        });

        return this.arrayToCSV(enrichedCommunications, headers);
    }

    // Generate opportunities CSV with company names
    static generateOpportunitiesCSV(opportunities, accounts) {
        const headers = [
            'Company Name', 'Opportunity Name', 'Stage', 'Value', 
            'Probability', 'Expected Close', 'Requirements', 'Competition', 'Created At'
        ];

        // Enrich opportunities with company names
        const enrichedOpportunities = opportunities.map(opp => {
            const account = accounts.find(acc => String(acc.account_id) === String(opp.account_id));
            return {
                ...opp,
                company_name: account ? account.company_name : 'Unknown Company'
            };
        });

        return this.arrayToCSV(enrichedOpportunities, headers);
    }

    // Create ZIP package with all CSV files
    static async createExportZip(accounts, contacts, communications, opportunities) {
        const zip = new JSZip();

        // Generate CSV content with natural identifiers
        const accountsCSV = this.generateAccountsCSV(accounts);
        const contactsCSV = this.generateContactsCSV(contacts, accounts);
        const communicationsCSV = this.generateCommunicationsCSV(communications, accounts, contacts);
        const opportunitiesCSV = this.generateOpportunitiesCSV(opportunities, accounts);

        // Add files to ZIP
        zip.file('accounts.csv', accountsCSV);
        zip.file('contacts.csv', contactsCSV);
        zip.file('communications.csv', communicationsCSV);
        zip.file('opportunities.csv', opportunitiesCSV);

        // Generate ZIP buffer
        return await zip.generateAsync({ type: 'nodebuffer' });
    }

    // Create sample template ZIP
    static async createSampleTemplate() {
        const zip = new JSZip();

        // Sample data with natural identifiers
        const sampleAccount = [{
            company_name: 'Acme Electronics Inc',
            industry: 'Electronics',
            company_size: 'Medium (51-200)',
            location: 'San Francisco, CA',
            website: 'https://acme-electronics.com',
            account_status: 'Customer',
            source: 'Cold Call',
            revenue_potential: 150000,
            decision_timeline: 'Short-term (1-3 months)',
            technical_requirements: 'High-frequency PCB boards for telecommunications equipment',
            current_supplier: 'TechPCB Corp',
            account_owner: 'John Smith',
            last_contact: '2025-01-15',
            next_followup: '2025-02-01',
            created_at: '2025-01-01 10:30:00',
            updated_at: '2025-01-15 14:22:00'
        }];

        const sampleContact = [{
            company_name: 'Acme Electronics Inc',
            first_name: 'Jane',
            last_name: 'Doe',
            title: 'Engineering Manager',
            email: 'jane.doe@acme-electronics.com',
            phone: '+1-555-123-4567',
            primary_contact: true,
            decision_maker: false,
            notes: 'Prefers technical documentation and detailed specifications',
            created_at: '2025-01-01 10:30:00'
        }];

        const sampleCommunication = [{
            company_name: 'Acme Electronics Inc',
            contact_first_name: 'Jane',
            contact_last_name: 'Doe',
            comm_date: '2025-01-15',
            comm_type: 'Email',
            direction: 'Outbound',
            subject: 'PCB Specification Inquiry',
            summary: 'Discussed technical requirements for upcoming project. Customer needs high-frequency boards.',
            next_steps: 'Send detailed specification document and pricing proposal',
            followup_required: true,
            followup_date: '2025-01-22',
            created_at: '2025-01-15 14:30:00'
        }];

        const sampleOpportunity = [{
            company_name: 'Acme Electronics Inc',
            opp_name: 'Q1 PCB Manufacturing Contract',
            stage: 'Proposal',
            value: 75000,
            probability: 60,
            expected_close: '2025-03-31',
            requirements: '500 units of high-frequency PCB boards with specialized coating',
            competition: 'CompetitorPCB Inc, FastBoards LLC',
            created_at: '2025-01-10 09:15:00'
        }];

        // Generate sample CSV files using the new natural identifier format
        const accountsCSV = this.generateAccountsCSV(sampleAccount);
        const contactsCSV = this.generateContactsCSV(sampleContact, sampleAccount);
        const communicationsCSV = this.generateCommunicationsCSV(sampleCommunication, sampleAccount, sampleContact);
        const opportunitiesCSV = this.generateOpportunitiesCSV(sampleOpportunity, sampleAccount);

        // Add files to ZIP
        zip.file('accounts.csv', accountsCSV);
        zip.file('contacts.csv', contactsCSV);
        zip.file('communications.csv', communicationsCSV);
        zip.file('opportunities.csv', opportunitiesCSV);

        // Add README file with instructions
        const readme = `# CRM Data Import Template

This ZIP file contains sample CSV files showing the correct format for importing data into the PCB CRM system using natural identifiers.

## Files Included:
- accounts.csv: Sample account data (no dependencies)
- contacts.csv: Sample contact data (linked by Company Name)
- communications.csv: Sample communication data (linked by Company Name + Contact Name)
- opportunities.csv: Sample opportunity data (linked by Company Name)

## Import Instructions:
1. Edit the CSV files with your actual data
2. Keep the header row intact
3. Follow the data format shown in the sample rows
4. Upload individual CSV files or the entire ZIP package
5. Import order: Accounts → Contacts → Communications/Opportunities

## Natural Identifier System:
- **NO MANUAL IDs REQUIRED** - All IDs are auto-generated
- **Contacts**: Match accounts using "Company Name"
- **Communications**: Match accounts using "Company Name", optionally match contacts using "Contact First Name" + "Contact Last Name"
- **Opportunities**: Match accounts using "Company Name"

## Important Notes:
- Company names must match exactly between files (case-sensitive)
- Contact names in communications must match exactly with contacts file
- Boolean fields should use TRUE/FALSE
- Dates should be in YYYY-MM-DD format
- Date/Time should be in YYYY-MM-DD HH:MM:SS format

## Required Fields:
- Accounts: Company Name
- Contacts: Company Name, First Name, Last Name
- Communications: Company Name, Communication Date, Communication Type, Direction, Subject
- Opportunities: Company Name, Opportunity Name, Stage

## Data Processing Order:
1. Accounts are processed first and auto-assigned IDs
2. Contacts are linked to accounts by matching Company Name
3. Communications are linked to accounts (and optionally contacts) by name matching
4. Opportunities are linked to accounts by Company Name matching
`;

        zip.file('README.txt', readme);

        return await zip.generateAsync({ type: 'nodebuffer' });
    }
}

module.exports = CSVExporter;