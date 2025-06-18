// Export functionality

async function exportData() {
    try {
        // Show loading indicator
        showLoadingToast('Generating export file...');
        
        const response = await fetch('/api/export/csv');
        
        if (!response.ok) {
            throw new Error(`Export failed: ${response.status}`);
        }
        
        // Get the file blob
        const blob = await response.blob();
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().split('T')[0];
        a.download = `CRM_Data_Export_${timestamp}.zip`;
        
        // Trigger download
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        hideLoadingToast();
        showSuccessToast('Data exported successfully!');
        
    } catch (error) {
        console.error('Export failed:', error);
        hideLoadingToast();
        showErrorToast('Failed to export data. Please try again.');
    }
}

async function downloadSampleTemplate() {
    try {
        // Show loading indicator
        showLoadingToast('Generating sample template...');
        
        const response = await fetch('/api/export/sample');
        
        if (!response.ok) {
            throw new Error(`Template download failed: ${response.status}`);
        }
        
        // Get the file blob
        const blob = await response.blob();
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'CRM_Import_Template.zip';
        
        // Trigger download
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        hideLoadingToast();
        showSuccessToast('Sample template downloaded successfully!');
        
        // Close dropdown if open
        hideImportDropdown();
        
    } catch (error) {
        console.error('Template download failed:', error);
        hideLoadingToast();
        showErrorToast('Failed to download template. Please try again.');
    }
}

// Toast notification functions
function showLoadingToast(message) {
    removeExistingToasts();
    const toast = createToast(message, 'loading');
    document.body.appendChild(toast);
}

function showSuccessToast(message) {
    removeExistingToasts();
    const toast = createToast(message, 'success');
    document.body.appendChild(toast);
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 3000);
}

function showErrorToast(message) {
    removeExistingToasts();
    const toast = createToast(message, 'error');
    document.body.appendChild(toast);
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 5000);
}

function hideLoadingToast() {
    removeExistingToasts();
}

function createToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = '';
    switch (type) {
        case 'loading':
            icon = '⏳';
            break;
        case 'success':
            icon = '✅';
            break;
        case 'error':
            icon = '❌';
            break;
    }
    
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">${icon}</span>
            <span class="toast-message">${message}</span>
        </div>
    `;
    
    return toast;
}

function removeExistingToasts() {
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    });
}