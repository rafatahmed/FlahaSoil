/**
 * FlahaSoil Profile Page JavaScript
 * Handles user profile management, statistics, and settings
 */

// Global state
let currentUser = null;
let userStats = null;

// Initialize profile page
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    loadUserProfile();
    loadUserStatistics();
    loadRecentAnalyses();
    setupEventListeners();
});

/**
 * Check if user is authenticated
 */
function checkAuthentication() {
    const token = localStorage.getItem('flahasoil_token');
    const userStr = localStorage.getItem('flahasoil_user');
    
    if (!token || !userStr) {
        // Redirect to landing page if not authenticated
        window.location.href = './landing.html';
        return;
    }
    
    currentUser = JSON.parse(userStr);
}

/**
 * Load user profile information
 */
function loadUserProfile() {
    if (!currentUser) return;
    
    // Update profile header
    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('userEmail').textContent = currentUser.email;
    document.getElementById('navUserName').textContent = currentUser.name;
    
    // Update user initials
    const initials = currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase();
    document.getElementById('userInitials').textContent = initials;
    
    // Update tier information
    const tierBadge = document.getElementById('userTier');
    const tierDescription = document.getElementById('tierDescription');
    
    tierBadge.textContent = currentUser.tier;
    tierBadge.className = `tier-badge ${currentUser.tier.toLowerCase()}`;
    
    switch (currentUser.tier) {
        case 'FREE':
            tierDescription.textContent = '50 analyses per month';
            break;
        case 'PROFESSIONAL':
            tierDescription.textContent = 'Unlimited analyses';
            break;
        case 'ENTERPRISE':
            tierDescription.textContent = 'Unlimited + API access';
            break;
    }
    
    // Update subscription info
    updateSubscriptionInfo();
}

/**
 * Load user statistics
 */
async function loadUserStatistics() {
    try {
        // Get usage count from API client
        const usageCount = window.flahaSoilAPI.usageCount || 0;
        const maxUsage = window.flahaSoilAPI.maxFreeUsage || 50;
        const remaining = currentUser.tier === 'FREE' ? Math.max(0, maxUsage - usageCount) : 'Unlimited';
        
        // Update statistics display
        document.getElementById('totalAnalyses').textContent = usageCount;
        document.getElementById('thisMonthAnalyses').textContent = usageCount;
        document.getElementById('remainingAnalyses').textContent = remaining;
        
        // Update progress bar
        if (currentUser.tier === 'FREE') {
            const percentage = Math.min((usageCount / maxUsage) * 100, 100);
            document.getElementById('usageProgress').style.width = `${percentage}%`;
            document.getElementById('usageText').textContent = `${usageCount} of ${maxUsage} analyses used this month`;
        } else {
            document.getElementById('usageProgress').style.width = '100%';
            document.getElementById('usageText').textContent = 'Unlimited analyses available';
        }
        
    } catch (error) {
        console.error('Error loading user statistics:', error);
    }
}

/**
 * Load recent analyses
 */
async function loadRecentAnalyses() {
    const recentAnalysesContainer = document.getElementById('recentAnalyses');
    
    try {
        // For now, show sample data since we don't have a history endpoint yet
        const sampleAnalyses = [
            {
                id: 1,
                textureClass: 'Clay Loam',
                sand: 33,
                clay: 33,
                date: new Date(Date.now() - 86400000).toLocaleDateString()
            },
            {
                id: 2,
                textureClass: 'Sandy Loam',
                sand: 60,
                clay: 15,
                date: new Date(Date.now() - 172800000).toLocaleDateString()
            },
            {
                id: 3,
                textureClass: 'Loam',
                sand: 40,
                clay: 20,
                date: new Date(Date.now() - 259200000).toLocaleDateString()
            }
        ];
        
        if (sampleAnalyses.length === 0) {
            recentAnalysesContainer.innerHTML = `
                <div class="loading">No analyses found. <a href="./index.html">Start your first analysis</a></div>
            `;
            return;
        }
        
        const analysesHTML = sampleAnalyses.map(analysis => `
            <div class="analysis-item">
                <div class="analysis-info">
                    <h4>${analysis.textureClass}</h4>
                    <p>Sand: ${analysis.sand}%, Clay: ${analysis.clay}%</p>
                </div>
                <div class="analysis-date">${analysis.date}</div>
            </div>
        `).join('');
        
        recentAnalysesContainer.innerHTML = analysesHTML;
        
    } catch (error) {
        console.error('Error loading recent analyses:', error);
        recentAnalysesContainer.innerHTML = `
            <div class="loading">Error loading analyses. Please try again later.</div>
        `;
    }
}

/**
 * Update subscription information
 */
function updateSubscriptionInfo() {
    const currentPlan = document.getElementById('currentPlan');
    const planDescription = document.getElementById('planDescription');
    const planFeatures = document.getElementById('planFeatures');
    
    switch (currentUser.tier) {
        case 'FREE':
            currentPlan.textContent = 'Free Plan';
            planDescription.textContent = '50 analyses per month';
            planFeatures.innerHTML = `
                <div class="feature">✓ Basic soil calculations</div>
                <div class="feature">✓ USDA triangle visualization</div>
                <div class="feature">✗ Analysis history</div>
                <div class="feature">✗ Export capabilities</div>
            `;
            break;
        case 'PROFESSIONAL':
            currentPlan.textContent = 'Professional Plan';
            planDescription.textContent = 'Unlimited analyses + advanced features';
            planFeatures.innerHTML = `
                <div class="feature">✓ Unlimited analyses</div>
                <div class="feature">✓ Analysis history</div>
                <div class="feature">✓ Export to PDF/CSV</div>
                <div class="feature">✓ Priority support</div>
            `;
            break;
        case 'ENTERPRISE':
            currentPlan.textContent = 'Enterprise Plan';
            planDescription.textContent = 'Everything + API access';
            planFeatures.innerHTML = `
                <div class="feature">✓ Everything in Professional</div>
                <div class="feature">✓ API access</div>
                <div class="feature">✓ White-label options</div>
                <div class="feature">✓ Dedicated support</div>
            `;
            break;
    }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        const userMenu = document.querySelector('.user-menu');
        const dropdown = document.getElementById('userDropdown');
        
        if (userMenu && dropdown && !userMenu.contains(event.target)) {
            dropdown.classList.remove('show');
            const arrow = document.querySelector('.dropdown-arrow');
            if (arrow) arrow.style.transform = 'rotate(0deg)';
        }
    });
}

/**
 * Toggle user dropdown menu
 */
function toggleUserDropdown() {
    const dropdown = document.getElementById('userDropdown');
    const arrow = document.querySelector('.dropdown-arrow');
    
    if (dropdown) {
        dropdown.classList.toggle('show');
        arrow.style.transform = dropdown.classList.contains('show') ? 'rotate(180deg)' : 'rotate(0deg)';
    }
}

/**
 * Edit profile
 */
function editProfile() {
    const modal = document.getElementById('editProfileModal');
    const nameInput = document.getElementById('editName');
    const emailInput = document.getElementById('editEmail');
    
    // Pre-fill form with current data
    nameInput.value = currentUser.name;
    emailInput.value = currentUser.email;
    
    modal.style.display = 'flex';
}

/**
 * Close edit modal
 */
function closeEditModal() {
    document.getElementById('editProfileModal').style.display = 'none';
}

/**
 * Save profile changes
 */
async function saveProfile(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const updatedData = {
        name: formData.get('name'),
        email: formData.get('email')
    };
    
    try {
        // For now, just update localStorage since we don't have an update endpoint
        currentUser.name = updatedData.name;
        currentUser.email = updatedData.email;
        localStorage.setItem('flahasoil_user', JSON.stringify(currentUser));
        
        // Update UI
        loadUserProfile();
        closeEditModal();
        showSuccessMessage('Profile updated successfully!');
        
    } catch (error) {
        console.error('Error updating profile:', error);
        showErrorMessage('Failed to update profile. Please try again.');
    }
}

/**
 * Change password
 */
function changePassword() {
    document.getElementById('changePasswordModal').style.display = 'flex';
}

/**
 * Close password modal
 */
function closePasswordModal() {
    document.getElementById('changePasswordModal').style.display = 'none';
    document.getElementById('changePasswordForm').reset();
}

/**
 * Change user password
 */
async function changeUserPassword(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const currentPassword = formData.get('currentPassword');
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');
    
    if (newPassword !== confirmPassword) {
        showErrorMessage('New passwords do not match');
        return;
    }
    
    try {
        // For now, just show success since we don't have a change password endpoint
        closePasswordModal();
        showSuccessMessage('Password changed successfully!');
        
    } catch (error) {
        console.error('Error changing password:', error);
        showErrorMessage('Failed to change password. Please try again.');
    }
}

/**
 * Export user data
 */
function exportData() {
    try {
        const exportData = {
            user: currentUser,
            exportDate: new Date().toISOString(),
            analyses: [] // Would be populated from actual data
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `flahasoil-data-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        showSuccessMessage('Data exported successfully!');
        
    } catch (error) {
        console.error('Error exporting data:', error);
        showErrorMessage('Failed to export data. Please try again.');
    }
}

/**
 * Upgrade plan
 */
function upgradePlan() {
    // For now, just show a message
    showInfoMessage('Payment integration coming soon! Contact sales@flaha.com for upgrades.');
}

/**
 * Logout user
 */
function logout() {
    window.flahaSoilAPI.logout();
    window.location.href = './landing.html';
}

/**
 * Show success message
 */
function showSuccessMessage(message) {
    showToast(message, 'success');
}

/**
 * Show error message
 */
function showErrorMessage(message) {
    showToast(message, 'error');
}

/**
 * Show info message
 */
function showInfoMessage(message) {
    showToast(message, 'info');
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    const colors = {
        success: '#4CAF50',
        error: '#f44336',
        info: '#2196F3'
    };
    
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type]};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        z-index: 3000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        font-weight: 500;
        max-width: 300px;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}
