// Communications page JavaScript

let currentCommunicationId = null;
let allCommunications = [];
let allAccounts = [];
let allContacts = [];

// Load all communications
async function loadCommunications() {
    try {
        showLoading('communicationsTableBody');
        
        // Ensure accounts are loaded first
        if (allAccounts.length === 0) {
            await loadAccountsForSelect();
        }
        
        const communications = await apiCall('/communications');
        allCommunications = communications;
        displayCommunications(communications);
    } catch (error) {
        console.error('Failed to load communications:', error);
        showAlert('Failed to load communications', 'error');
        document.getElementById('communicationsTableBody').innerHTML = 
            '<tr><td colspan="8" class="text-center">Failed to load communications</td></tr>';
    }
}

// Load accounts for select dropdowns
async function loadAccountsForSelect() {
    try {
        const [accounts, contacts] = await Promise.all([
            apiCall('/accounts'),
            apiCall('/contacts')
        ]);
        
        allAccounts = accounts;
        allContacts = contacts;
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

// Load contacts for specific account
function loadContactsForAccount(accountId) {
    const contactSelect = document.getElementById('contact_id');
    contactSelect.innerHTML = '<option value="">Select Contact (Optional)</option>';
    
    if (!accountId) return;
    
    const accountContacts = allContacts.filter(contact => String(contact.account_id) === String(accountId));
    accountContacts.forEach(contact => {
        const option = document.createElement('option');
        option.value = contact.contact_id;
        option.textContent = `${contact.first_name} ${contact.last_name}`;
        contactSelect.appendChild(option);
    });
}

// Display communications in table
function displayCommunications(communications) {
    const tbody = document.getElementById('communicationsTableBody');
    
    if (!communications || communications.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No communications found</td></tr>';
        return;
    }
    
    let html = '';
    communications.forEach(comm => {
        const account = allAccounts.find(acc => String(acc.account_id) === String(comm.account_id));
        const contact = allContacts.find(c => String(c.contact_id) === String(comm.contact_id));
        
        const contactName = contact ? `${contact.first_name} ${contact.last_name}` : '-';
        const directionBadge = comm.direction === 'Inbound' ? 
            '<span class="status-badge status-customer">Inbound</span>' : 
            '<span class="status-badge status-prospect">Outbound</span>';
        
        const followupBadge = comm.followup_required ? 
            `<span class="status-badge" style="background-color: #fff3cd; color: #856404;">Due: ${formatDate(comm.followup_date)}</span>` : 
            '-';
        
        html += `
            <tr data-record-id="${comm.comm_id}">
                <td>${formatDate(comm.comm_date)}</td>
                <td>${account ? account.company_name : 'Unknown'}</td>
                <td>${contactName}</td>
                <td>${comm.comm_type}</td>
                <td>
                    <strong>${comm.subject}</strong>
                    ${comm.summary ? `<br><small style="color: #666;">${comm.summary.substring(0, 80)}${comm.summary.length > 80 ? '...' : ''}</small>` : ''}
                </td>
                <td>${directionBadge}</td>
                <td>${followupBadge}</td>
                <td>
                    <button onclick="editCommunication('${comm.comm_id}')" class="btn btn-sm btn-secondary">Edit</button>
                    <button onclick="deleteCommunication('${comm.comm_id}', '${comm.subject}')" class="btn btn-sm btn-danger">Delete</button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
    
    // Make rows clickable for detail view
    makeRowsClickable('communicationsTable', showCommunicationDetail);
}

// Show communication form
function showCommunicationForm(communicationData = null) {
    currentCommunicationId = communicationData ? communicationData.comm_id : null;
    const modal = document.getElementById('communicationModal');
    const form = document.getElementById('communicationForm');
    const title = document.getElementById('modalTitle');
    
    if (communicationData) {
        title.textContent = 'Edit Communication';
        populateCommunicationForm(form, communicationData);
        // Load contacts for the selected account
        if (communicationData.account_id) {
            loadContactsForAccount(communicationData.account_id);
        }
    } else {
        title.textContent = 'Log Communication';
        form.reset();
        // Set today's date as default
        document.getElementById('comm_date').value = new Date().toISOString().split('T')[0];
    }
    
    showModal('communicationModal');
}

// Populate form with communication data
function populateCommunicationForm(form, data) {
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

// Edit communication
async function editCommunication(commId) {
    try {
        const communication = await apiCall(`/communications/${commId}`);
        showCommunicationForm(communication);
    } catch (error) {
        console.error('Failed to load communication:', error);
        showAlert('Failed to load communication details', 'error');
    }
}

// Delete communication
async function deleteCommunication(commId, subject) {
    if (!confirm(`Are you sure you want to delete the communication "${subject}"? This action cannot be undone.`)) {
        return;
    }
    
    try {
        await apiCall(`/communications/${commId}`, { method: 'DELETE' });
        showAlert('Communication deleted successfully');
        loadCommunications();
    } catch (error) {
        console.error('Failed to delete communication:', error);
        showAlert('Failed to delete communication', 'error');
    }
}

// Filter communications
function filterCommunications() {
    const accountFilter = document.getElementById('accountFilter').value;
    const typeFilter = document.getElementById('typeFilter').value;
    
    let filteredComms = allCommunications;
    
    if (accountFilter) {
        filteredComms = filteredComms.filter(comm => String(comm.account_id) === String(accountFilter));
    }
    
    if (typeFilter) {
        filteredComms = filteredComms.filter(comm => comm.comm_type === typeFilter);
    }
    
    displayCommunications(filteredComms);
}

// Handle form submission
document.getElementById('communicationForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const communicationData = {};
    
    // Convert FormData to plain object
    for (let [key, value] of formData.entries()) {
        if (key === 'followup_required') {
            communicationData[key] = 1;
        } else {
            communicationData[key] = value;
        }
    }
    
    // Set unchecked checkbox to 0
    if (!communicationData.followup_required) communicationData.followup_required = 0;
    
    // Validate required fields
    const errors = validateForm(communicationData, ['account_id', 'comm_date', 'comm_type', 'direction', 'subject']);
    if (errors.length > 0) {
        showAlert(errors.join('\n'), 'error');
        return;
    }
    
    try {
        if (currentCommunicationId) {
            // Update existing communication
            await apiCall(`/communications/${currentCommunicationId}`, {
                method: 'PUT',
                body: JSON.stringify(communicationData)
            });
            showAlert('Communication updated successfully');
        } else {
            // Create new communication
            await apiCall('/communications', {
                method: 'POST',
                body: JSON.stringify(communicationData)
            });
            showAlert('Communication logged successfully');
        }
        
        hideModal('communicationModal');
        loadCommunications();
        
    } catch (error) {
        console.error('Failed to save communication:', error);
        showAlert('Failed to save communication', 'error');
    }
});

// Show communication detail view
async function showCommunicationDetail(commId) {
    try {
        const communication = await apiCall(`/communications/${commId}`);
        populateCommunicationDetail(communication);
        showDetailModal('communicationDetailModal');
    } catch (error) {
        console.error('Failed to load communication details:', error);
        showAlert('Failed to load communication details', 'error');
    }
}

// Populate communication detail modal
function populateCommunicationDetail(comm) {
    const account = allAccounts.find(acc => String(acc.account_id) === String(comm.account_id));
    const contact = allContacts.find(c => String(c.contact_id) === String(comm.contact_id));
    
    document.getElementById('detail-comm-date').innerHTML = formatDetailDate(comm.comm_date);
    document.getElementById('detail-comm-type').innerHTML = formatDetailText(comm.comm_type);
    
    const directionBadge = comm.direction === 'Inbound' ? 
        '<span class="status-badge status-customer">Inbound</span>' : 
        '<span class="status-badge status-prospect">Outbound</span>';
    document.getElementById('detail-comm-direction').innerHTML = directionBadge;
    
    document.getElementById('detail-comm-subject').innerHTML = formatDetailText(comm.subject);
    
    document.getElementById('detail-comm-account').innerHTML = account ? account.company_name : '<span class="empty">Unknown</span>';
    document.getElementById('detail-comm-contact').innerHTML = contact ? 
        `${contact.first_name} ${contact.last_name}` : 
        '<span class="empty">No contact specified</span>';
    
    document.getElementById('detail-comm-summary').innerHTML = formatDetailText(comm.summary);
    document.getElementById('detail-comm-next-steps').innerHTML = formatDetailText(comm.next_steps);
    
    document.getElementById('detail-comm-followup-required').innerHTML = formatDetailBoolean(comm.followup_required, 'Yes', 'No');
    document.getElementById('detail-comm-followup-date').innerHTML = formatDetailDate(comm.followup_date);
    
    document.getElementById('detail-comm-created').innerHTML = formatDetailDate(comm.created_at);
    document.getElementById('detail-comm-id').innerHTML = formatDetailText(comm.comm_id);
}

// Initialize communications page
function initCommunicationsPage() {
    loadCommunications();
    loadAccountsForSelect();
}