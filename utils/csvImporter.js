const JSZip = require('jszip');

class CSVImporter {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.importedCounts = {
            accounts: 0,
            contacts: 0,
            communications: 0,
            opportunities: 0
        };
        // Cache for lookups during import
        this.accountCache = new Map(); // company_name -> account_id
        this.contactCache = new Map(); // "company_name|first_name|last_name" -> contact_id
    }

    // Parse CSV string to array of objects
    static parseCSV(csvString) {
        const lines = csvString.trim().split('\n');
        if (lines.length < 2) {
            throw new Error('CSV file must contain at least a header row and one data row');
        }

        const headers = CSVImporter.parseCSVLine(lines[0]);
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '') continue; // Skip empty lines
            
            const values = CSVImporter.parseCSVLine(lines[i]);
            if (values.length !== headers.length) {
                throw new Error(`Row ${i + 1}: Expected ${headers.length} columns, got ${values.length}`);
            }

            const row = {};
            headers.forEach((header, index) => {
                const fieldName = CSVImporter.getFieldNameFromHeader(header.trim());
                let value = values[index].trim();

                // Convert data types
                if (value === '') {
                    row[fieldName] = null;
                } else if (value.toUpperCase() === 'TRUE') {
                    row[fieldName] = true;
                } else if (value.toUpperCase() === 'FALSE') {
                    row[fieldName] = false;
                } else if (!isNaN(value) && value !== '') {
                    row[fieldName] = parseFloat(value);
                } else {
                    row[fieldName] = value;
                }
            });
            data.push(row);
        }

        return { headers, data };
    }

    // Parse a single CSV line handling quoted fields
    static parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        let i = 0;

        while (i < line.length) {
            const char = line[i];
            const nextChar = line[i + 1];

            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    // Escaped quote
                    current += '"';
                    i += 2;
                } else {
                    // Toggle quote state
                    inQuotes = !inQuotes;
                    i++;
                }
            } else if (char === ',' && !inQuotes) {
                // Field separator
                result.push(current);
                current = '';
                i++;
            } else {
                current += char;
                i++;
            }
        }

        // Add the last field
        result.push(current);
        return result;
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

    // Extract files from ZIP
    async extractFromZip(zipBuffer) {
        const zip = new JSZip();
        const zipData = await zip.loadAsync(zipBuffer);
        const files = {};

        for (const filename in zipData.files) {
            if (filename.endsWith('.csv')) {
                const content = await zipData.files[filename].async('string');
                files[filename] = content;
            }
        }

        return files;
    }

    // Initialize lookup caches from existing database records
    async initializeCaches(database) {
        // Load existing accounts
        const accounts = await database.getAllAccounts();
        accounts.forEach(account => {
            this.accountCache.set(account.company_name.toLowerCase(), account.account_id);
        });

        // Load existing contacts
        const contacts = await database.getAllContacts();
        contacts.forEach(contact => {
            const key = `${contact.company_name}|${contact.first_name}|${contact.last_name}`.toLowerCase();
            this.contactCache.set(key, contact.contact_id);
        });
    }

    // Find or create account by company name
    async findOrCreateAccount(companyName, database) {
        const normalizedName = companyName.toLowerCase();
        
        // Check cache first
        if (this.accountCache.has(normalizedName)) {
            return this.accountCache.get(normalizedName);
        }

        // Search in database
        const accounts = await database.getAllAccounts();
        const existingAccount = accounts.find(acc => 
            acc.company_name.toLowerCase() === normalizedName
        );

        if (existingAccount) {
            this.accountCache.set(normalizedName, existingAccount.account_id);
            return existingAccount.account_id;
        }

        // Create new account with minimal data
        const newAccount = {
            company_name: companyName,
            industry: null,
            company_size: null,
            location: null,
            website: null,
            account_status: 'Prospect',
            source: 'Import',
            revenue_potential: null,
            decision_timeline: null,
            technical_requirements: null,
            current_supplier: null,
            account_owner: null,
            last_contact: null,
            next_followup: null
        };

        const account = await database.createAccount(newAccount);
        const accountId = account.account_id;
        this.accountCache.set(normalizedName, accountId);
        return accountId;
    }

    // Find contact by company name + first name + last name
    async findContact(companyName, firstName, lastName, database) {
        if (!firstName || !lastName) return null;
        
        const key = `${companyName}|${firstName}|${lastName}`.toLowerCase();
        
        // Check cache first
        if (this.contactCache.has(key)) {
            return this.contactCache.get(key);
        }

        // Search in database with account lookup
        const accountId = await this.findOrCreateAccount(companyName, database);
        const contacts = await database.getAllContacts();
        
        const existingContact = contacts.find(contact => 
            String(contact.account_id) === String(accountId) &&
            contact.first_name.toLowerCase() === firstName.toLowerCase() &&
            contact.last_name.toLowerCase() === lastName.toLowerCase()
        );

        if (existingContact) {
            this.contactCache.set(key, existingContact.contact_id);
            return existingContact.contact_id;
        }

        return null;
    }

    // Validate data according to business rules
    validateData(data, type) {
        const errors = [];

        data.forEach((row, index) => {
            const rowNum = index + 2; // +2 because index starts at 0 and we skip header

            switch (type) {
                case 'accounts':
                    if (!row.company_name) {
                        errors.push(`Row ${rowNum}: Company Name is required`);
                    }
                    if (row.revenue_potential && row.revenue_potential < 0) {
                        errors.push(`Row ${rowNum}: Revenue Potential cannot be negative`);
                    }
                    if (row.email && !this.isValidEmail(row.email)) {
                        errors.push(`Row ${rowNum}: Invalid email format`);
                    }
                    break;

                case 'contacts':
                    if (!row.company_name) {
                        errors.push(`Row ${rowNum}: Company Name is required`);
                    }
                    if (!row.first_name) {
                        errors.push(`Row ${rowNum}: First Name is required`);
                    }
                    if (!row.last_name) {
                        errors.push(`Row ${rowNum}: Last Name is required`);
                    }
                    if (row.email && !this.isValidEmail(row.email)) {
                        errors.push(`Row ${rowNum}: Invalid email format`);
                    }
                    break;

                case 'communications':
                    if (!row.company_name) {
                        errors.push(`Row ${rowNum}: Company Name is required`);
                    }
                    if (!row.comm_date) {
                        errors.push(`Row ${rowNum}: Communication Date is required`);
                    }
                    if (!row.comm_type) {
                        errors.push(`Row ${rowNum}: Communication Type is required`);
                    }
                    if (!row.direction) {
                        errors.push(`Row ${rowNum}: Direction is required`);
                    }
                    if (!row.subject) {
                        errors.push(`Row ${rowNum}: Subject is required`);
                    }
                    if (row.direction && !['Inbound', 'Outbound'].includes(row.direction)) {
                        errors.push(`Row ${rowNum}: Direction must be 'Inbound' or 'Outbound'`);
                    }
                    break;

                case 'opportunities':
                    if (!row.company_name) {
                        errors.push(`Row ${rowNum}: Company Name is required`);
                    }
                    if (!row.opp_name) {
                        errors.push(`Row ${rowNum}: Opportunity Name is required`);
                    }
                    if (!row.stage) {
                        errors.push(`Row ${rowNum}: Stage is required`);
                    }
                    if (row.probability && (row.probability < 0 || row.probability > 100)) {
                        errors.push(`Row ${rowNum}: Probability must be between 0 and 100`);
                    }
                    if (row.value && row.value < 0) {
                        errors.push(`Row ${rowNum}: Value cannot be negative`);
                    }
                    break;
            }

            // Common date validation
            if (row.comm_date && !this.isValidDate(row.comm_date)) {
                errors.push(`Row ${rowNum}: Invalid date format for Communication Date`);
            }
            if (row.expected_close && !this.isValidDate(row.expected_close)) {
                errors.push(`Row ${rowNum}: Invalid date format for Expected Close`);
            }
            if (row.last_contact && !this.isValidDate(row.last_contact)) {
                errors.push(`Row ${rowNum}: Invalid date format for Last Contact`);
            }
            if (row.next_followup && !this.isValidDate(row.next_followup)) {
                errors.push(`Row ${rowNum}: Invalid date format for Next Followup`);
            }
            if (row.followup_date && !this.isValidDate(row.followup_date)) {
                errors.push(`Row ${rowNum}: Invalid date format for Followup Date`);
            }
        });

        return errors;
    }

    // Validate email format
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Validate date format (YYYY-MM-DD)
    isValidDate(dateString) {
        if (!dateString) return true; // Allow empty dates
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date) && dateString.match(/^\d{4}-\d{2}-\d{2}$/);
    }

    // Process import data
    async processImport(fileBuffer, filename, database) {
        try {
            const results = {
                success: false,
                errors: [],
                warnings: [],
                imported: {
                    accounts: 0,
                    contacts: 0,
                    communications: 0,
                    opportunities: 0
                }
            };

            let files = {};

            // Initialize lookup caches
            await this.initializeCaches(database);

            // Determine if it's a ZIP or CSV file
            if (filename.endsWith('.zip')) {
                files = await this.extractFromZip(fileBuffer);
            } else if (filename.endsWith('.csv')) {
                // Single CSV file - determine type by filename or content
                const content = fileBuffer.toString('utf8');
                files[filename] = content;
            } else {
                results.errors.push('Unsupported file format. Please upload CSV or ZIP files.');
                return results;
            }

            // Sort files by processing order: accounts first, then others
            const sortedFiles = Object.entries(files).sort(([fileNameA], [fileNameB]) => {
                const getOrder = (name) => {
                    if (name.includes('account')) return 1;
                    if (name.includes('contact')) return 2;
                    if (name.includes('communication')) return 3;
                    if (name.includes('opportunit')) return 3;
                    return 4;
                };
                return getOrder(fileNameA) - getOrder(fileNameB);
            });

            // Process each file in order
            for (const [fileName, content] of sortedFiles) {
                try {
                    const { headers, data } = CSVImporter.parseCSV(content);
                    
                    // Determine data type based on filename or headers
                    let dataType = this.determineDataType(fileName, headers);
                    
                    if (!dataType) {
                        results.warnings.push(`Skipped ${fileName}: Could not determine data type`);
                        continue;
                    }

                    // Validate data
                    const validationErrors = this.validateData(data, dataType);
                    if (validationErrors.length > 0) {
                        results.errors.push(...validationErrors.map(err => `${fileName}: ${err}`));
                        continue;
                    }

                    // Import data to database
                    const importedCount = await this.importToDatabase(data, dataType, database);
                    results.imported[dataType] += importedCount;

                } catch (error) {
                    results.errors.push(`Error processing ${fileName}: ${error.message}`);
                }
            }

            results.success = results.errors.length === 0;
            return results;

        } catch (error) {
            return {
                success: false,
                errors: [`Import failed: ${error.message}`],
                warnings: [],
                imported: { accounts: 0, contacts: 0, communications: 0, opportunities: 0 }
            };
        }
    }

    // Determine data type from filename or headers
    determineDataType(filename, headers) {
        // First try filename
        if (filename.includes('account')) return 'accounts';
        if (filename.includes('contact')) return 'contacts';
        if (filename.includes('communication')) return 'communications';
        if (filename.includes('opportunit')) return 'opportunities';

        // Try headers
        const headerString = headers.join(' ').toLowerCase();
        if (headerString.includes('company name')) return 'accounts';
        if (headerString.includes('first name') && headerString.includes('last name')) return 'contacts';
        if (headerString.includes('communication date') || headerString.includes('comm_date')) return 'communications';
        if (headerString.includes('opportunity name') || headerString.includes('opp_name')) return 'opportunities';

        return null;
    }

    // Import data to database with natural identifier resolution
    async importToDatabase(data, dataType, database) {
        let count = 0;

        for (const row of data) {
            try {
                let processedRow = { ...row };
                
                switch (dataType) {
                    case 'accounts':
                        // Accounts are straightforward - no ID resolution needed
                        const account = await database.createAccount(processedRow);
                        this.accountCache.set(processedRow.company_name.toLowerCase(), account.account_id);
                        break;
                        
                    case 'contacts':
                        // Resolve account by company name
                        if (processedRow.company_name) {
                            processedRow.account_id = await this.findOrCreateAccount(processedRow.company_name, database);
                            
                            // Cache this contact for future communications lookups
                            const contact = await database.createContact(processedRow);
                            const key = `${processedRow.company_name}|${processedRow.first_name}|${processedRow.last_name}`.toLowerCase();
                            this.contactCache.set(key, contact.contact_id);
                        }
                        break;
                        
                    case 'communications':
                        // Resolve account by company name
                        if (processedRow.company_name) {
                            processedRow.account_id = await this.findOrCreateAccount(processedRow.company_name, database);
                            
                            // Optionally resolve contact by name
                            if (processedRow.contact_first_name && processedRow.contact_last_name) {
                                processedRow.contact_id = await this.findContact(
                                    processedRow.company_name,
                                    processedRow.contact_first_name,
                                    processedRow.contact_last_name,
                                    database
                                );
                            }
                            
                            // Remove the helper fields before database insert
                            delete processedRow.company_name;
                            delete processedRow.contact_first_name;
                            delete processedRow.contact_last_name;
                            
                            await database.createCommunication(processedRow);
                        }
                        break;
                        
                    case 'opportunities':
                        // Resolve account by company name
                        if (processedRow.company_name) {
                            processedRow.account_id = await this.findOrCreateAccount(processedRow.company_name, database);
                            
                            // Remove the helper field before database insert
                            delete processedRow.company_name;
                            
                            await database.createOpportunity(processedRow);
                        }
                        break;
                }
                count++;
            } catch (error) {
                // Skip rows that fail to import but don't stop the entire process
                console.error(`Failed to import ${dataType} row:`, error.message);
            }
        }

        return count;
    }
}

module.exports = CSVImporter;