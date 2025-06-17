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
            <tr>
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