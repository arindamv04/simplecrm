// Accounts page JavaScript

let currentAccountId = null;

// Load all accounts
async function loadAccounts() {
    try {
        showLoading('accountsTableBody');
        const accounts = await apiCall('/accounts');
        displayAccounts(accounts);
    } catch (error) {
        console.error('Failed to load accounts:', error);
        showAlert('Failed to load accounts', 'error');
        document.getElementById('accountsTableBody').innerHTML = 
            '<tr><td colspan="6" class="text-center">Failed to load accounts</td></tr>';
    }
}

// Display accounts in table
function displayAccounts(accounts) {
    const tbody = document.getElementById('accountsTableBody');
    
    if (!accounts || accounts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No accounts found</td></tr>';
        return;
    }
    
    let html = '';
    accounts.forEach(account => {
        html += `
            <tr data-record-id="${account.account_id}">
                <td>
                    <strong>${account.company_name}</strong>
                    ${account.website ? `<br><small><a href="${account.website}" target="_blank" style="color: #667eea;">${account.website}</a></small>` : ''}
                </td>
                <td>${account.industry || '-'}</td>
                <td><span class="status-badge status-${account.account_status.toLowerCase()}">${account.account_status}</span></td>
                <td>${account.location || '-'}</td>
                <td>${formatDate(account.created_at)}</td>
                <td>
                    <button onclick="editAccount('${account.account_id}')" class="btn btn-sm btn-secondary">Edit</button>
                    <button onclick="deleteAccount('${account.account_id}', '${account.company_name}')" class="btn btn-sm btn-danger">Delete</button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
    
    // Make rows clickable for detail view
    makeRowsClickable('accountsTable', showAccountDetail);
}

// Show account form
function showAccountForm(accountData = null) {
    currentAccountId = accountData ? accountData.account_id : null;
    const modal = document.getElementById('accountModal');
    const form = document.getElementById('accountForm');
    const title = document.getElementById('modalTitle');
    
    if (accountData) {
        title.textContent = 'Edit Account';
        populateForm(form, accountData);
    } else {
        title.textContent = 'Add New Account';
        form.reset();
    }
    
    showModal('accountModal');
}

// Populate form with account data
function populateForm(form, data) {
    Object.keys(data).forEach(key => {
        const field = form.querySelector(`[name="${key}"]`);
        if (field) {
            field.value = data[key] || '';
        }
    });
}

// Edit account
async function editAccount(accountId) {
    try {
        const account = await apiCall(`/accounts/${accountId}`);
        showAccountForm(account);
    } catch (error) {
        console.error('Failed to load account:', error);
        showAlert('Failed to load account details', 'error');
    }
}

// Delete account
async function deleteAccount(accountId, companyName) {
    if (!confirm(`Are you sure you want to delete "${companyName}"? This action cannot be undone.`)) {
        return;
    }
    
    try {
        await apiCall(`/accounts/${accountId}`, { method: 'DELETE' });
        showAlert('Account deleted successfully');
        loadAccounts();
    } catch (error) {
        console.error('Failed to delete account:', error);
        showAlert('Failed to delete account', 'error');
    }
}

// Handle form submission
document.getElementById('accountForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const accountData = {};
    
    // Convert FormData to plain object
    for (let [key, value] of formData.entries()) {
        accountData[key] = value;
    }
    
    // Validate required fields
    const errors = validateForm(accountData, ['company_name']);
    if (errors.length > 0) {
        showAlert(errors.join('\n'), 'error');
        return;
    }
    
    try {
        if (currentAccountId) {
            // Update existing account
            await apiCall(`/accounts/${currentAccountId}`, {
                method: 'PUT',
                body: JSON.stringify(accountData)
            });
            showAlert('Account updated successfully');
        } else {
            // Create new account
            await apiCall('/accounts', {
                method: 'POST',
                body: JSON.stringify(accountData)
            });
            showAlert('Account created successfully');
        }
        
        hideModal('accountModal');
        loadAccounts();
        
    } catch (error) {
        console.error('Failed to save account:', error);
        
        // Handle duplicate company name error
        if (error.message.includes('Similar company names')) {
            const confirmCreate = confirm(
                'Similar company names already exist in the system. Do you want to create this account anyway?'
            );
            
            if (confirmCreate) {
                // Force create by bypassing duplicate check (you might want to add a force parameter to API)
                showAlert('Please check for existing similar companies before creating', 'warning');
            }
        } else {
            showAlert('Failed to save account', 'error');
        }
    }
});

// Show account detail view
async function showAccountDetail(accountId) {
    try {
        const account = await apiCall(`/accounts/${accountId}`);
        populateAccountDetail(account);
        showDetailModal('accountDetailModal');
    } catch (error) {
        console.error('Failed to load account details:', error);
        showAlert('Failed to load account details', 'error');
    }
}

// Populate account detail modal
function populateAccountDetail(account) {
    document.getElementById('detail-company-name').innerHTML = formatDetailText(account.company_name);
    document.getElementById('detail-industry').innerHTML = formatDetailText(account.industry);
    document.getElementById('detail-company-size').innerHTML = formatDetailText(account.company_size);
    document.getElementById('detail-location').innerHTML = formatDetailText(account.location);
    document.getElementById('detail-website').innerHTML = formatDetailWebsite(account.website);
    
    document.getElementById('detail-account-status').innerHTML = formatDetailStatusBadge(account.account_status);
    document.getElementById('detail-source').innerHTML = formatDetailText(account.source);
    document.getElementById('detail-revenue-potential').innerHTML = formatDetailCurrency(account.revenue_potential);
    document.getElementById('detail-decision-timeline').innerHTML = formatDetailText(account.decision_timeline);
    
    document.getElementById('detail-technical-requirements').innerHTML = formatDetailText(account.technical_requirements);
    document.getElementById('detail-current-supplier').innerHTML = formatDetailText(account.current_supplier);
    
    document.getElementById('detail-account-owner').innerHTML = formatDetailText(account.account_owner);
    document.getElementById('detail-last-contact').innerHTML = formatDetailDate(account.last_contact);
    document.getElementById('detail-next-followup').innerHTML = formatDetailDate(account.next_followup);
    
    document.getElementById('detail-created-at').innerHTML = formatDetailDate(account.created_at);
    document.getElementById('detail-updated-at').innerHTML = formatDetailDate(account.updated_at);
    document.getElementById('detail-account-id').innerHTML = formatDetailText(account.account_id);
}

// Initialize accounts page
function initAccountsPage() {
    // Set up search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            searchTable('accountsTable', e.target.value);
        });
    }
    
    // Load accounts
    loadAccounts();
}