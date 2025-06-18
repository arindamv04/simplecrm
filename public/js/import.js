// Import functionality

let importDropdownVisible = false;

// Toggle import dropdown
function toggleImportDropdown() {
    const dropdown = document.getElementById('importDropdown');
    if (!dropdown) return;
    
    if (importDropdownVisible) {
        hideImportDropdown();
    } else {
        showImportDropdown();
    }
}

function showImportDropdown() {
    const dropdown = document.getElementById('importDropdown');
    if (!dropdown) return;
    
    dropdown.classList.add('show');
    importDropdownVisible = true;
    
    // Close dropdown when clicking outside
    setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
    }, 0);
}

function hideImportDropdown() {
    const dropdown = document.getElementById('importDropdown');
    if (!dropdown) return;
    
    dropdown.classList.remove('show');
    importDropdownVisible = false;
    document.removeEventListener('click', handleClickOutside);
}

function handleClickOutside(event) {
    const dropdown = document.getElementById('importDropdown');
    const button = event.target.closest('.btn-import');
    
    if (!dropdown || !dropdown.contains(event.target) && !button) {
        hideImportDropdown();
    }
}

// Show import modal
function showImportModal() {
    hideImportDropdown();
    
    // Create import modal if it doesn't exist
    if (!document.getElementById('importModal')) {
        createImportModal();
    }
    
    document.getElementById('importModal').style.display = 'block';
}

function hideImportModal() {
    const modal = document.getElementById('importModal');
    if (modal) {
        modal.style.display = 'none';
        
        // Reset file input and results
        const fileInput = document.getElementById('importFileInput');
        const resultsDiv = document.getElementById('importResults');
        
        if (fileInput) fileInput.value = '';
        if (resultsDiv) resultsDiv.innerHTML = '';
    }
}

// Create import modal
function createImportModal() {
    const modal = document.createElement('div');
    modal.id = 'importModal';
    modal.className = 'modal';
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h2>Import Data</h2>
                <span class="close" onclick="hideImportModal()">&times;</span>
            </div>
            <div class="modal-body">
                <div class="import-section">
                    <h3>Upload Data File</h3>
                    <div class="file-upload-area" id="fileUploadArea">
                        <input type="file" id="importFileInput" accept=".csv,.zip" style="display: none;">
                        <div class="upload-text" onclick="document.getElementById('importFileInput').click()">
                            <div class="upload-icon">📁</div>
                            <p>Click to browse or drag CSV/ZIP file here</p>
                            <small>Supported formats: .csv, .zip (Max 10MB)</small>
                        </div>
                    </div>
                    <div id="selectedFile" class="selected-file" style="display: none;"></div>
                    <div class="import-actions" style="margin-top: 15px;">
                        <button onclick="validateImportFile()" class="btn btn-secondary" id="validateBtn" disabled>
                            🔍 Validate File
                        </button>
                        <button onclick="processImport()" class="btn btn-primary" id="importBtn" disabled>
                            📥 Import Data
                        </button>
                    </div>
                </div>
                
                <hr style="margin: 30px 0;">
                
                <div class="import-section">
                    <h3>Download Sample Template</h3>
                    <p>Download a ZIP containing CSV templates with sample data to understand the expected format.</p>
                    <button onclick="downloadSampleTemplate()" class="btn btn-secondary">
                        📄 Download Sample Template
                    </button>
                </div>
                
                <div id="importResults" class="import-results" style="margin-top: 20px;"></div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Set up file input handler
    const fileInput = document.getElementById('importFileInput');
    const fileUploadArea = document.getElementById('fileUploadArea');
    
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop handlers
    fileUploadArea.addEventListener('dragover', handleDragOver);
    fileUploadArea.addEventListener('drop', handleFileDrop);
    fileUploadArea.addEventListener('dragleave', handleDragLeave);
}

// File handling functions
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        displaySelectedFile(file);
    }
}

function handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add('drag-over');
}

function handleDragLeave(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');
}

function handleFileDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        document.getElementById('importFileInput').files = files;
        displaySelectedFile(file);
    }
}

function displaySelectedFile(file) {
    const selectedFileDiv = document.getElementById('selectedFile');
    const validateBtn = document.getElementById('validateBtn');
    const importBtn = document.getElementById('importBtn');
    
    // Check file type
    const validTypes = ['.csv', '.zip'];
    const isValidType = validTypes.some(type => file.name.toLowerCase().endsWith(type));
    
    if (!isValidType) {
        showErrorInModal('Invalid file type. Please select a CSV or ZIP file.');
        return;
    }
    
    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
        showErrorInModal('File too large. Please select a file smaller than 10MB.');
        return;
    }
    
    selectedFileDiv.innerHTML = `
        <div class="file-info">
            <span class="file-icon">📄</span>
            <div class="file-details">
                <div class="file-name">${file.name}</div>
                <div class="file-size">${formatFileSize(file.size)}</div>
            </div>
            <button onclick="clearSelectedFile()" class="btn-clear">×</button>
        </div>
    `;
    selectedFileDiv.style.display = 'block';
    
    // Enable buttons
    validateBtn.disabled = false;
    importBtn.disabled = false;
    
    // Clear any previous results
    document.getElementById('importResults').innerHTML = '';
}

function clearSelectedFile() {
    document.getElementById('importFileInput').value = '';
    document.getElementById('selectedFile').style.display = 'none';
    document.getElementById('validateBtn').disabled = true;
    document.getElementById('importBtn').disabled = true;
    document.getElementById('importResults').innerHTML = '';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Import processing functions
async function validateImportFile() {
    const fileInput = document.getElementById('importFileInput');
    const file = fileInput.files[0];
    
    if (!file) {
        showErrorInModal('Please select a file first.');
        return;
    }
    
    try {
        showLoadingInModal('Validating file...');
        
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/import/validate', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok) {
            displayValidationResults(result);
        } else {
            showErrorInModal(result.error || 'Validation failed');
        }
        
    } catch (error) {
        console.error('Validation error:', error);
        showErrorInModal('Failed to validate file. Please try again.');
    }
}

async function processImport() {
    const fileInput = document.getElementById('importFileInput');
    const file = fileInput.files[0];
    
    if (!file) {
        showErrorInModal('Please select a file first.');
        return;
    }
    
    try {
        showLoadingInModal('Importing data...');
        
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/import/csv', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        displayImportResults(result);
        
        // Refresh data if import was successful
        if (result.success) {
            setTimeout(() => {
                location.reload();
            }, 2000);
        }
        
    } catch (error) {
        console.error('Import error:', error);
        showErrorInModal('Failed to import data. Please try again.');
    }
}

// Results display functions
function displayValidationResults(result) {
    const resultsDiv = document.getElementById('importResults');
    
    let html = '<div class="validation-results"><h4>Validation Results</h4>';
    
    result.results.forEach(fileResult => {
        const isValid = fileResult.valid;
        const statusIcon = isValid ? '✅' : '❌';
        
        html += `
            <div class="file-result ${isValid ? 'valid' : 'invalid'}">
                <div class="file-result-header">
                    ${statusIcon} <strong>${fileResult.filename}</strong>
                    <span class="data-type">(${fileResult.dataType})</span>
                    <span class="record-count">${fileResult.recordCount} records</span>
                </div>
        `;
        
        if (fileResult.errors && fileResult.errors.length > 0) {
            html += '<ul class="error-list">';
            fileResult.errors.forEach(error => {
                html += `<li>${error}</li>`;
            });
            html += '</ul>';
        }
        
        html += '</div>';
    });
    
    html += '</div>';
    resultsDiv.innerHTML = html;
}

function displayImportResults(result) {
    const resultsDiv = document.getElementById('importResults');
    
    let html = `<div class="import-results ${result.success ? 'success' : 'error'}">`;
    html += `<h4>${result.success ? '✅' : '❌'} Import ${result.success ? 'Successful' : 'Failed'}</h4>`;
    
    if (result.success) {
        html += '<div class="import-summary">';
        html += `<p><strong>Records imported:</strong></p>`;
        html += '<ul>';
        Object.entries(result.imported).forEach(([type, count]) => {
            if (count > 0) {
                html += `<li>${type}: ${count} records</li>`;
            }
        });
        html += '</ul>';
        
        if (result.warnings && result.warnings.length > 0) {
            html += '<p><strong>Warnings:</strong></p><ul>';
            result.warnings.forEach(warning => {
                html += `<li>${warning}</li>`;
            });
            html += '</ul>';
        }
        
        html += '<p><em>Page will refresh in 2 seconds...</em></p>';
        html += '</div>';
    } else {
        if (result.errors && result.errors.length > 0) {
            html += '<p><strong>Errors:</strong></p><ul>';
            result.errors.forEach(error => {
                html += `<li>${error}</li>`;
            });
            html += '</ul>';
        }
    }
    
    html += '</div>';
    resultsDiv.innerHTML = html;
}

function showLoadingInModal(message) {
    const resultsDiv = document.getElementById('importResults');
    resultsDiv.innerHTML = `
        <div class="loading-message">
            <div class="spinner"></div>
            <p>${message}</p>
        </div>
    `;
}

function showErrorInModal(message) {
    const resultsDiv = document.getElementById('importResults');
    resultsDiv.innerHTML = `
        <div class="error-message">
            ❌ <strong>Error:</strong> ${message}
        </div>
    `;
}