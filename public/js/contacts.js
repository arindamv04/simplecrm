// Contacts page JavaScript

let currentContactId = null;
let allContacts = [];
let allAccounts = [];

// Load all contacts
async function loadContacts() {
    try {
        showLoading('contactsTableBody');
        
        // Ensure accounts are loaded first
        if (allAccounts.length === 0) {
            await loadAccountsForSelect();
        }
        
        const contacts = await apiCall('/contacts');
        allContacts = contacts;
        displayContacts(contacts);
    } catch (error) {
        console.error('Failed to load contacts:', error);
        showAlert('Failed to load contacts', 'error');
        document.getElementById('contactsTableBody').innerHTML = 
            '<tr><td colspan="7" class="text-center">Failed to load contacts</td></tr>';
    }
}

// Load accounts for select dropdowns
async function loadAccountsForSelect() {
    try {
        const accounts = await apiCall('/accounts');
        allAccounts = accounts;
        populateAccountSelects(accounts);
    } catch (error) {
        console.error('Failed to load accounts for select:', error);
    }
}

// Populate account select dropdowns
function populateAccountSelects(accounts) {
    const accountSelect = document.getElementById('account_id');
    const accountFilter = document.getElementById('accountFilter');
    
    // Clear existing options (except first one)
    accountSelect.innerHTML = '<option value="">Select Account</option>';
    accountFilter.innerHTML = '<option value="">All Accounts</option>';
    
    accounts.forEach(account => {
        const option1 = document.createElement('option');
        option1.value = account.account_id;
        option1.textContent = account.company_name;
        accountSelect.appendChild(option1);
        
        const option2 = document.createElement('option');
        option2.value = account.account_id;
        option2.textContent = account.company_name;
        accountFilter.appendChild(option2);
    });
}

// Display contacts in table
function displayContacts(contacts) {
    const tbody = document.getElementById('contactsTableBody');
    
    if (!contacts || contacts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No contacts found</td></tr>';
        return;
    }
    
    let html = '';
    contacts.forEach(contact => {
        const account = allAccounts.find(acc => String(acc.account_id) === String(contact.account_id));
        const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
        
        let flags = '';
        if (contact.primary_contact) flags += '<span class="status-badge status-customer">Primary</span> ';
        if (contact.decision_maker) flags += '<span class="status-badge status-prospect">Decision Maker</span>';
        
        html += `
            <tr data-record-id="${contact.contact_id}">
                <td>
                    <strong>${fullName}</strong>
                    ${contact.notes ? `<br><small style="color: #666;">${contact.notes.substring(0, 50)}${contact.notes.length > 50 ? '...' : ''}</small>` : ''}
                </td>
                <td>${account ? account.company_name : 'Unknown'}</td>
                <td>${contact.title || '-'}</td>
                <td>${contact.email ? `<a href="mailto:${contact.email}" style="color: #667eea;">${contact.email}</a>` : '-'}</td>
                <td>${contact.phone ? `<a href="tel:${contact.phone}" style="color: #667eea;">${contact.phone}</a>` : '-'}</td>
                <td>${flags || '-'}</td>
                <td>
                    <button onclick="editContact('${contact.contact_id}')" class="btn btn-sm btn-secondary">Edit</button>
                    <button onclick="deleteContact('${contact.contact_id}', '${fullName}')" class="btn btn-sm btn-danger">Delete</button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
    
    // Make rows clickable for detail view
    makeRowsClickable('contactsTable', showContactDetail);
}

// Show contact form
function showContactForm(contactData = null) {
    currentContactId = contactData ? contactData.contact_id : null;
    const modal = document.getElementById('contactModal');
    const form = document.getElementById('contactForm');
    const title = document.getElementById('modalTitle');
    
    if (contactData) {
        title.textContent = 'Edit Contact';
        populateContactForm(form, contactData);
    } else {
        title.textContent = 'Add New Contact';
        form.reset();
    }
    
    showModal('contactModal');
}

// Populate form with contact data
function populateContactForm(form, data) {
    Object.keys(data).forEach(key => {
        const field = form.querySelector(`[name="${key}"]`);
        if (field) {
            if (field.type === 'checkbox') {
                field.checked = data[key] == 1;
            } else {
                field.value = data[key] || '';
            }
        }
    });
}

// Edit contact
async function editContact(contactId) {
    try {
        const contact = await apiCall(`/contacts/${contactId}`);
        showContactForm(contact);
    } catch (error) {
        console.error('Failed to load contact:', error);
        showAlert('Failed to load contact details', 'error');
    }
}

// Delete contact
async function deleteContact(contactId, contactName) {
    if (!confirm(`Are you sure you want to delete "${contactName}"? This action cannot be undone.`)) {
        return;
    }
    
    try {
        await apiCall(`/contacts/${contactId}`, { method: 'DELETE' });
        showAlert('Contact deleted successfully');
        loadContacts();
    } catch (error) {
        console.error('Failed to delete contact:', error);
        showAlert('Failed to delete contact', 'error');
    }
}

// Filter contacts by account
function filterContactsByAccount(accountId) {
    if (!accountId) {
        displayContacts(allContacts);
        return;
    }
    
    const filteredContacts = allContacts.filter(contact => String(contact.account_id) === String(accountId));
    displayContacts(filteredContacts);
}

// Handle form submission
document.getElementById('contactForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const contactData = {};
    
    // Convert FormData to plain object
    for (let [key, value] of formData.entries()) {
        if (key === 'primary_contact' || key === 'decision_maker') {
            contactData[key] = 1;
        } else {
            contactData[key] = value;
        }
    }
    
    // Set unchecked checkboxes to 0
    if (!contactData.primary_contact) contactData.primary_contact = 0;
    if (!contactData.decision_maker) contactData.decision_maker = 0;
    
    // Validate required fields
    const errors = validateForm(contactData, ['account_id', 'first_name', 'last_name']);
    if (errors.length > 0) {
        showAlert(errors.join('\n'), 'error');
        return;
    }
    
    try {
        if (currentContactId) {
            // Update existing contact
            await apiCall(`/contacts/${currentContactId}`, {
                method: 'PUT',
                body: JSON.stringify(contactData)
            });
            showAlert('Contact updated successfully');
        } else {
            // Create new contact
            await apiCall('/contacts', {
                method: 'POST',
                body: JSON.stringify(contactData)
            });
            showAlert('Contact created successfully');
        }
        
        hideModal('contactModal');
        loadContacts();
        
    } catch (error) {
        console.error('Failed to save contact:', error);
        showAlert('Failed to save contact', 'error');
    }
});

// Show contact detail view
async function showContactDetail(contactId) {
    try {
        const contact = await apiCall(`/contacts/${contactId}`);
        populateContactDetail(contact);
        showDetailModal('contactDetailModal');
    } catch (error) {
        console.error('Failed to load contact details:', error);
        showAlert('Failed to load contact details', 'error');
    }
}

// Populate contact detail modal
function populateContactDetail(contact) {
    const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
    const account = allAccounts.find(acc => String(acc.account_id) === String(contact.account_id));
    
    document.getElementById('detail-contact-name').innerHTML = formatDetailText(fullName);
    document.getElementById('detail-contact-title').innerHTML = formatDetailText(contact.title);
    document.getElementById('detail-contact-email').innerHTML = formatDetailEmail(contact.email);
    document.getElementById('detail-contact-phone').innerHTML = formatDetailPhone(contact.phone);
    
    document.getElementById('detail-contact-company').innerHTML = account ? account.company_name : '<span class="empty">Unknown</span>';
    
    let flags = '';
    if (contact.primary_contact) flags += '<span class="status-badge status-customer">Primary Contact</span> ';
    if (contact.decision_maker) flags += '<span class="status-badge status-prospect">Decision Maker</span>';
    document.getElementById('detail-contact-flags').innerHTML = flags || '<span class="empty">None</span>';
    
    document.getElementById('detail-contact-notes').innerHTML = formatDetailText(contact.notes);
    
    document.getElementById('detail-contact-created').innerHTML = formatDetailDate(contact.created_at);
    document.getElementById('detail-contact-id').innerHTML = formatDetailText(contact.contact_id);
}

// Initialize contacts page
function initContactsPage() {
    loadContacts();
    loadAccountsForSelect();
}