// Main JavaScript file for PCB CRM

// API Base URL
const API_BASE = '/api';

// Utility functions
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <div class="loading" style="display: block;">
                <div class="spinner"></div>
                <p>Loading...</p>
            </div>
        `;
    }
}

function hideLoading(elementId) {
    const loadingElement = document.querySelector(`#${elementId} .loading`);
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}

function showAlert(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    // Insert at the top of the container
    const container = document.querySelector('.container');
    if (container) {
        container.insertBefore(alertDiv, container.firstChild);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.parentNode.removeChild(alertDiv);
            }
        }, 5000);
    }
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatCurrency(amount) {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// API functions
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// Dashboard functions
async function loadDashboard() {
    try {
        const stats = await apiCall('/dashboard');
        updateDashboardStats(stats);
        displayAccountStatusChart(stats.accountsByStatus);
        await loadRecentActivity();
    } catch (error) {
        console.error('Failed to load dashboard:', error);
        showAlert('Failed to load dashboard data', 'error');
    }
}

function updateDashboardStats(stats) {
    document.getElementById('totalAccounts').textContent = stats.totalAccounts.count;
    document.getElementById('totalContacts').textContent = stats.totalContacts.count;
    document.getElementById('totalOpportunities').textContent = stats.totalOpportunities.count;
    document.getElementById('totalCommunications').textContent = stats.totalCommunications.count;
}

function displayAccountStatusChart(accountsByStatus) {
    const chartContainer = document.getElementById('accountStatusChart');
    
    if (!accountsByStatus || accountsByStatus.length === 0) {
        chartContainer.innerHTML = '<p class="text-center">No account data available</p>';
        return;
    }
    
    let chartHTML = '<div style="display: flex; gap: 20px; flex-wrap: wrap;">';
    
    accountsByStatus.forEach(status => {
        chartHTML += `
            <div class="stat-card" style="min-width: 150px;">
                <div class="stat-number">${status.count}</div>
                <div class="stat-label">${status.account_status}</div>
            </div>
        `;
    });
    
    chartHTML += '</div>';
    chartContainer.innerHTML = chartHTML;
}

async function loadRecentActivity() {
    try {
        // Get recent accounts, communications, and opportunities
        const [accounts, communications, opportunities] = await Promise.all([
            apiCall('/accounts'),
            apiCall('/communications'),
            apiCall('/opportunities')
        ]);
        
        const activities = [];
        
        // Add recent accounts
        accounts.slice(0, 3).forEach(account => {
            activities.push({
                type: 'account',
                title: `New account: ${account.company_name}`,
                date: account.created_at,
                icon: '🏢'
            });
        });
        
        // Add recent communications
        communications.slice(0, 3).forEach(comm => {
            activities.push({
                type: 'communication',
                title: `Communication: ${comm.subject || 'No subject'}`,
                date: comm.created_at,
                icon: '💬'
            });
        });
        
        // Add recent opportunities
        opportunities.slice(0, 3).forEach(opp => {
            activities.push({
                type: 'opportunity',
                title: `Opportunity: ${opp.opp_name}`,
                date: opp.created_at,
                icon: '💰'
            });
        });
        
        // Sort by date (most recent first)
        activities.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        displayRecentActivity(activities.slice(0, 10));
    } catch (error) {
        console.error('Failed to load recent activity:', error);
        document.getElementById('recentActivity').innerHTML = 
            '<p class="text-center">Failed to load recent activity</p>';
    }
}

function displayRecentActivity(activities) {
    const container = document.getElementById('recentActivity');
    
    if (!activities || activities.length === 0) {
        container.innerHTML = '<p class="text-center">No recent activity</p>';
        return;
    }
    
    let activityHTML = '<div class="activity-list">';
    
    activities.forEach(activity => {
        activityHTML += `
            <div style="display: flex; align-items: center; padding: 10px 0; border-bottom: 1px solid #e1e8ed;">
                <span style="font-size: 1.5rem; margin-right: 15px;">${activity.icon}</span>
                <div style="flex: 1;">
                    <div style="font-weight: 500;">${activity.title}</div>
                    <div style="color: #666; font-size: 0.9rem;">${formatDate(activity.date)}</div>
                </div>
            </div>
        `;
    });
    
    activityHTML += '</div>';
    container.innerHTML = activityHTML;
}

// Modal functions
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Form validation
function validateForm(formData, requiredFields) {
    const errors = [];
    
    requiredFields.forEach(field => {
        if (!formData[field] || formData[field].trim() === '') {
            errors.push(`${field.replace('_', ' ')} is required`);
        }
    });
    
    if (formData.email && !isValidEmail(formData.email)) {
        errors.push('Please enter a valid email address');
    }
    
    return errors;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Table sorting
function sortTable(tableId, columnIndex, type = 'string') {
    const table = document.getElementById(tableId);
    if (!table) return;
    
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    const isAscending = table.dataset.sortDirection !== 'asc';
    table.dataset.sortDirection = isAscending ? 'asc' : 'desc';
    
    rows.sort((a, b) => {
        const aVal = a.cells[columnIndex].textContent.trim();
        const bVal = b.cells[columnIndex].textContent.trim();
        
        let comparison = 0;
        
        if (type === 'number') {
            comparison = parseFloat(aVal) - parseFloat(bVal);
        } else if (type === 'date') {
            comparison = new Date(aVal) - new Date(bVal);
        } else {
            comparison = aVal.localeCompare(bVal);
        }
        
        return isAscending ? comparison : -comparison;
    });
    
    rows.forEach(row => tbody.appendChild(row));
}

// Search functionality
function searchTable(tableId, searchTerm) {
    const table = document.getElementById(tableId);
    if (!table) return;
    
    const tbody = table.querySelector('tbody');
    const rows = tbody.querySelectorAll('tr');
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        let found = false;
        
        cells.forEach(cell => {
            if (cell.textContent.toLowerCase().includes(searchTerm.toLowerCase())) {
                found = true;
            }
        });
        
        row.style.display = found ? '' : 'none';
    });
}

// Set active navigation
function setActiveNav(currentPage) {
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });
}

// Initialize page
function initializePage() {
    // Set active navigation based on current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    setActiveNav(currentPage === 'index.html' ? '/' : currentPage);
    
    // Close modals when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
    
    // Close modals with Escape key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                if (modal.style.display === 'block') {
                    modal.style.display = 'none';
                }
            });
            
            // Close detail modals
            const detailModals = document.querySelectorAll('.detail-modal');
            detailModals.forEach(modal => {
                if (modal.classList.contains('show')) {
                    hideDetailModal(modal.id);
                }
            });
        }
    });
}

// Detail View Modal Functions
function showDetailModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
}

function hideDetailModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Restore background scrolling
    }
}

// Utility functions for detail views
function formatDetailDate(dateString) {
    if (!dateString) return '<span class="empty">Not set</span>';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (error) {
        return '<span class="empty">Invalid date</span>';
    }
}

function formatDetailCurrency(amount) {
    if (!amount || amount === 0) return '<span class="empty">Not set</span>';
    
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    } catch (error) {
        return '<span class="empty">Invalid amount</span>';
    }
}

function formatDetailText(text) {
    if (!text || text.trim() === '') return '<span class="empty">Not provided</span>';
    return text;
}

function formatDetailEmail(email) {
    if (!email) return '<span class="empty">Not provided</span>';
    return `<a href="mailto:${email}" class="link">${email}</a>`;
}

function formatDetailPhone(phone) {
    if (!phone) return '<span class="empty">Not provided</span>';
    return `<a href="tel:${phone}" class="link">${phone}</a>`;
}

function formatDetailWebsite(website) {
    if (!website) return '<span class="empty">Not provided</span>';
    
    // Add protocol if missing
    let url = website;
    if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
    }
    
    return `<a href="${url}" target="_blank" class="link">${website}</a>`;
}

function formatDetailStatusBadge(status) {
    if (!status) return '<span class="empty">Not set</span>';
    
    let badgeClass = 'status-badge';
    switch(status.toLowerCase()) {
        case 'customer':
            badgeClass += ' status-customer';
            break;
        case 'prospect':
            badgeClass += ' status-prospect';
            break;
        case 'inactive':
            badgeClass += ' status-inactive';
            break;
        default:
            badgeClass += ' status-prospect';
    }
    
    return `<span class="${badgeClass}">${status}</span>`;
}

function formatDetailBoolean(value, trueText = 'Yes', falseText = 'No') {
    if (value === 1 || value === true || value === 'true') {
        return `<span class="status-badge status-customer">${trueText}</span>`;
    }
    return `<span class="status-badge status-inactive">${falseText}</span>`;
}

// Make table rows clickable (excluding action buttons)
function makeRowsClickable(tableId, detailFunction) {
    const table = document.getElementById(tableId);
    if (!table) return;
    
    const tbody = table.querySelector('tbody');
    if (!tbody) return;
    
    // Remove existing click listeners
    tbody.removeEventListener('click', handleRowClick);
    
    // Add new click listener
    tbody.addEventListener('click', function(e) {
        handleRowClick(e, detailFunction);
    });
}

function handleRowClick(event, detailFunction) {
    // Don't trigger on action buttons or their children
    if (event.target.closest('.btn') || event.target.closest('button')) {
        return;
    }
    
    const row = event.target.closest('tr');
    if (!row || !row.dataset.recordId) {
        return;
    }
    
    const recordId = row.dataset.recordId;
    detailFunction(recordId);
}

// Add record ID to table rows
function addRecordIdToRows(tableBodyId, records, idField = 'id') {
    const tbody = document.getElementById(tableBodyId);
    if (!tbody) return;
    
    const rows = tbody.querySelectorAll('tr');
    rows.forEach((row, index) => {
        if (records[index] && records[index][idField]) {
            row.dataset.recordId = records[index][idField];
        }
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializePage);