// Opportunities page JavaScript

let currentOpportunityId = null;
let allOpportunities = [];
let allAccounts = [];

// Load all opportunities
async function loadOpportunities() {
    try {
        showLoading('opportunitiesTableBody');
        
        // Ensure accounts are loaded first
        if (allAccounts.length === 0) {
            await loadAccountsForSelect();
        }
        
        const opportunities = await apiCall('/opportunities');
        allOpportunities = opportunities;
        displayOpportunities(opportunities);
        calculateOpportunityStats();
    } catch (error) {
        console.error('Failed to load opportunities:', error);
        showAlert('Failed to load opportunities', 'error');
        document.getElementById('opportunitiesTableBody').innerHTML = 
            '<tr><td colspan="8" class="text-center">Failed to load opportunities</td></tr>';
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

// Calculate and display opportunity statistics
function calculateOpportunityStats() {
    if (!allOpportunities || allOpportunities.length === 0) {
        document.getElementById('totalOpps').textContent = '0';
        document.getElementById('totalValue').textContent = '$0';
        document.getElementById('avgValue').textContent = '$0';
        document.getElementById('avgProbability').textContent = '0%';
        return;
    }
    
    const totalOpps = allOpportunities.length;
    const totalValue = allOpportunities.reduce((sum, opp) => sum + (parseFloat(opp.value) || 0), 0);
    const avgValue = totalOpps > 0 ? totalValue / totalOpps : 0;
    const avgProbability = allOpportunities.reduce((sum, opp) => sum + (parseInt(opp.probability) || 0), 0) / totalOpps;
    
    document.getElementById('totalOpps').textContent = totalOpps.toString();
    document.getElementById('totalValue').textContent = formatCurrency(totalValue);
    document.getElementById('avgValue').textContent = formatCurrency(avgValue);
    document.getElementById('avgProbability').textContent = Math.round(avgProbability) + '%';
}

// Display opportunities in table
function displayOpportunities(opportunities) {
    const tbody = document.getElementById('opportunitiesTableBody');
    
    if (!opportunities || opportunities.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No opportunities found</td></tr>';
        return;
    }
    
    let html = '';
    opportunities.forEach(opp => {
        const account = allAccounts.find(acc => String(acc.account_id) === String(opp.account_id));
        
        // Stage badge styling
        let stageBadge = '';
        switch(opp.stage) {
            case 'Prospecting':
                stageBadge = '<span class="status-badge" style="background-color: #e3f2fd; color: #1976d2;">Prospecting</span>';
                break;
            case 'Qualification':
                stageBadge = '<span class="status-badge" style="background-color: #fff3e0; color: #f57c00;">Qualification</span>';
                break;
            case 'Proposal':
                stageBadge = '<span class="status-badge" style="background-color: #f3e5f5; color: #7b1fa2;">Proposal</span>';
                break;
            case 'Negotiation':
                stageBadge = '<span class="status-badge" style="background-color: #fff8e1; color: #f9a825;">Negotiation</span>';
                break;
            case 'Closed Won':
                stageBadge = '<span class="status-badge status-customer">Closed Won</span>';
                break;
            case 'Closed Lost':
                stageBadge = '<span class="status-badge status-inactive">Closed Lost</span>';
                break;
            default:
                stageBadge = `<span class="status-badge status-prospect">${opp.stage}</span>`;
        }
        
        const weightedValue = (parseFloat(opp.value) || 0) * (parseInt(opp.probability) || 0) / 100;
        
        html += `
            <tr>
                <td>
                    <strong>${opp.opp_name}</strong>
                    ${opp.requirements ? `<br><small style="color: #666;">${opp.requirements.substring(0, 60)}${opp.requirements.length > 60 ? '...' : ''}</small>` : ''}
                </td>
                <td>${account ? account.company_name : 'Unknown'}</td>
                <td>${stageBadge}</td>
                <td>
                    ${formatCurrency(opp.value)}
                    ${opp.probability ? `<br><small style="color: #666;">Weighted: ${formatCurrency(weightedValue)}</small>` : ''}
                </td>
                <td>${opp.probability || 0}%</td>
                <td>${formatDate(opp.expected_close)}</td>
                <td>${formatDate(opp.created_at)}</td>
                <td>
                    <button onclick="editOpportunity('${opp.opp_id}')" class="btn btn-sm btn-secondary">Edit</button>
                    <button onclick="deleteOpportunity('${opp.opp_id}', '${opp.opp_name}')" class="btn btn-sm btn-danger">Delete</button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

// Show opportunity form
function showOpportunityForm(opportunityData = null) {
    currentOpportunityId = opportunityData ? opportunityData.opp_id : null;
    const modal = document.getElementById('opportunityModal');
    const form = document.getElementById('opportunityForm');
    const title = document.getElementById('modalTitle');
    
    if (opportunityData) {
        title.textContent = 'Edit Opportunity';
        populateOpportunityForm(form, opportunityData);
    } else {
        title.textContent = 'Create Opportunity';
        form.reset();
        // Set default values
        document.getElementById('probability').value = '50';
    }
    
    showModal('opportunityModal');
}

// Populate form with opportunity data
function populateOpportunityForm(form, data) {
    Object.keys(data).forEach(key => {
        const field = form.querySelector(`[name="${key}"]`);
        if (field) {
            field.value = data[key] || '';
        }
    });
}

// Edit opportunity
async function editOpportunity(oppId) {
    try {
        const opportunity = await apiCall(`/opportunities/${oppId}`);
        showOpportunityForm(opportunity);
    } catch (error) {
        console.error('Failed to load opportunity:', error);
        showAlert('Failed to load opportunity details', 'error');
    }
}

// Delete opportunity
async function deleteOpportunity(oppId, oppName) {
    if (!confirm(`Are you sure you want to delete the opportunity "${oppName}"? This action cannot be undone.`)) {
        return;
    }
    
    try {
        await apiCall(`/opportunities/${oppId}`, { method: 'DELETE' });
        showAlert('Opportunity deleted successfully');
        loadOpportunities();
    } catch (error) {
        console.error('Failed to delete opportunity:', error);
        showAlert('Failed to delete opportunity', 'error');
    }
}

// Filter opportunities
function filterOpportunities() {
    const accountFilter = document.getElementById('accountFilter').value;
    const stageFilter = document.getElementById('stageFilter').value;
    
    let filteredOpps = allOpportunities;
    
    if (accountFilter) {
        filteredOpps = filteredOpps.filter(opp => String(opp.account_id) === String(accountFilter));
    }
    
    if (stageFilter) {
        filteredOpps = filteredOpps.filter(opp => opp.stage === stageFilter);
    }
    
    displayOpportunities(filteredOpps);
}

// Handle form submission
document.getElementById('opportunityForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const opportunityData = {};
    
    // Convert FormData to plain object
    for (let [key, value] of formData.entries()) {
        opportunityData[key] = value;
    }
    
    // Validate required fields
    const errors = validateForm(opportunityData, ['account_id', 'opp_name', 'stage']);
    if (errors.length > 0) {
        showAlert(errors.join('\n'), 'error');
        return;
    }
    
    // Validate probability range
    if (opportunityData.probability && (opportunityData.probability < 0 || opportunityData.probability > 100)) {
        showAlert('Probability must be between 0 and 100', 'error');
        return;
    }
    
    try {
        if (currentOpportunityId) {
            // Update existing opportunity
            await apiCall(`/opportunities/${currentOpportunityId}`, {
                method: 'PUT',
                body: JSON.stringify(opportunityData)
            });
            showAlert('Opportunity updated successfully');
        } else {
            // Create new opportunity
            await apiCall('/opportunities', {
                method: 'POST',
                body: JSON.stringify(opportunityData)
            });
            showAlert('Opportunity created successfully');
        }
        
        hideModal('opportunityModal');
        loadOpportunities();
        
    } catch (error) {
        console.error('Failed to save opportunity:', error);
        showAlert('Failed to save opportunity', 'error');
    }
});

// Initialize opportunities page
function initOpportunitiesPage() {
    loadOpportunities();
    loadAccountsForSelect();
}