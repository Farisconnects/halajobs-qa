// HALAJOBS.QA - Complete Qatar Theme Script

// Configuration with your Supabase credentials
const supabaseUrl = "https://ehoctsjvtfuesqeonlco.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVob2N0c2p2dGZ1ZXNxZW9ubGNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5OTU2ODcsImV4cCI6MjA3MjU3MTY4N30.kGz2t58YXWTwOB_h40dH0GOBLF12FQxKsZnqQ983Xro";

// Admin configuration
const ADMIN_PASSCODE = "451588";
let isAdminMode = false;
let sessionDeletions = 0;
let jobToDelete = null;
let currentPostingMode = 'detailed';
let currentApplication = null;

// Initialize Supabase client
let supabase = null;
let isSupabaseConnected = false;

// Category data with Qatar focus
const qatarCategories = [
    { name: 'IT', icon: '💻', count: 0, label: 'IT & Tech' },
    { name: 'Healthcare', icon: '🏥', count: 0, label: 'Healthcare' },
    { name: 'Construction', icon: '🏗️', count: 0, label: 'Construction' },
    { name: 'Driver', icon: '🚗', count: 0, label: 'Driver' },
    { name: 'Sales', icon: '💼', count: 0, label: 'Sales' },
    { name: 'Delivery', icon: '📦', count: 0, label: 'Delivery' },
    { name: 'Engineer', icon: '⚙️', count: 0, label: 'Engineer' },
    { name: 'Accountant', icon: '📊', count: 0, label: 'Accountant' },
    { name: 'Technician', icon: '🔧', count: 0, label: 'Technician' },
    { name: 'Others', icon: '💼', count: 0, label: 'Others' }
];

// Demo data for fallback
let demoJobs = [
    {
        id: 1,
        position: "Senior Software Engineer",
        company: "Tech Qatar Solutions",
        description: "Join our innovative team building next-generation solutions for Qatar's digital transformation. We're looking for experienced developers with React, Node.js, and cloud technologies expertise.",
        salary: "QR 12,000",
        category: "IT",
        location: "West Bay, Doha",
        contact: "careers@techqatar.com",
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        poster_url: null,
        is_image_only: false
    },
    {
        id: 2,
        position: "Registered Nurse",
        company: "Hamad Medical Corporation",
        description: "Seeking qualified nurses for our expanding healthcare facilities. Excellent benefits package, professional development opportunities, and competitive salary in Qatar's leading healthcare system.",
        salary: "QR 9,200",
        category: "Healthcare",
        location: "Medical City, Doha",
        contact: "hr@hmc.gov.qa",
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        poster_url: null,
        is_image_only: false
    },
    {
        id: 3,
        position: "Marketing Manager",
        company: "Doha Marketing Hub",
        description: "Lead marketing strategies for Qatar's fastest growing companies. Develop campaigns, manage digital presence, and drive business growth in the dynamic Qatar market.",
        salary: "QR 8,500",
        category: "Sales",
        location: "The Pearl, Doha",
        contact: "jobs@dohamarketing.com",
        created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        poster_url: null,
        is_image_only: false
    },
    {
        id: 4,
        position: "Delivery Driver",
        company: "Qatar Express",
        description: "Flexible working hours with competitive pay and tips. Join Qatar's largest delivery network with benefits, fuel allowance, and career advancement opportunities.",
        salary: "QR 3,500+",
        category: "Delivery",
        location: "Al Rayyan",
        contact: null,
        created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        poster_url: null,
        is_image_only: false
    }
];

// DOM elements
const jobsList = document.getElementById('jobsList');
const modal = document.getElementById('jobModal');
const applicationModal = document.getElementById('applicationModal');
const adminPanel = document.getElementById('adminPanel');
const confirmModal = document.getElementById('confirmModal');
const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');

// Initialize Supabase
try {
    if (window.supabase && supabaseUrl && supabaseKey) {
        supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
        isSupabaseConnected = true;
        console.log("✅ Supabase connected successfully!");
    } else {
        throw new Error("Supabase not available");
    }
} catch (error) {
    console.warn("⚠️ Supabase connection failed:", error.message);
    console.log("Using demo data instead");
    isSupabaseConnected = false;
}

// Show demo notice if not connected to Supabase
if (!isSupabaseConnected) {
    const demoNotice = document.getElementById('demoNotice');
    if (demoNotice) demoNotice.style.display = "block";
}

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    console.log('🇶🇦 HALAJOBS.QA Qatar Theme Loading...');
    
    setupEventListeners();
    loadJobs();
    animateStatsOnScroll();
    
    // Track page view
    if (typeof gtag !== 'undefined') {
        gtag('event', 'page_view', {
            page_title: 'Qatar Jobs Portal',
            custom_parameter_1: 'qatar_focus'
        });
    }
    
    console.log('🚀 HALAJOBS.QA Qatar Theme Loaded Successfully!');
});

// Setup all event listeners
function setupEventListeners() {
    // Admin mode toggle
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.shiftKey && e.key === 'M') {
            e.preventDefault();
            toggleAdminMode();
        }
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });

    // Modal event listeners
    if (modal) {
        const openModal = document.getElementById('openModal');
        const openQuickModal = document.getElementById('openQuickModal');
        const closeModal = document.getElementById('closeModal');
        const submitJob = document.getElementById('submitJob');

        if (openModal) openModal.onclick = () => openJobModal('detailed');
        if (openQuickModal) openQuickModal.onclick = () => openJobModal('quick');
        if (closeModal) closeModal.onclick = closeJobModal;
        if (submitJob) submitJob.onclick = addJob;

        // Posting mode toggle
        const detailedModeBtn = document.getElementById('detailedModeBtn');
        const quickModeBtn = document.getElementById('quickModeBtn');
        
        if (detailedModeBtn) detailedModeBtn.onclick = () => switchPostingMode('detailed');
        if (quickModeBtn) quickModeBtn.onclick = () => switchPostingMode('quick');
    }

    // Application modal
    if (applicationModal) {
        const proceedToApply = document.getElementById('proceedToApply');
        if (proceedToApply) {
            proceedToApply.onclick = function() {
                if (currentApplication) {
                    // Track application proceed
                    if (typeof gtag !== 'undefined') {
                        gtag('event', 'apply_proceed', {
                            job_id: currentApplication.jobId,
                            job_title: currentApplication.jobTitle,
                            company: currentApplication.company
                        });
                    }
                    closeApplicationModal();
                    showNotification('Redirecting to full job details...', 'success');
                }
            };
        }
    }

    // Confirmation modal
    if (confirmModal) {
        const confirmDelete = document.getElementById('confirmDelete');
        const cancelDelete = document.getElementById('cancelDelete');
        
        if (confirmDelete) confirmDelete.onclick = confirmDeletion;
        if (cancelDelete) cancelDelete.onclick = cancelJobDelete;
    }

    // File upload handlers
    setupFileUploadHandlers();

    // Search functionality
    const searchForm = document.querySelector('.search-form');
    if (searchForm) {
        searchForm.onsubmit = performSearch;
    }

    // Click outside modals to close
    window.onclick = function(e) {
        if (e.target === modal) closeJobModal();
        if (e.target === applicationModal) closeApplicationModal();
        if (e.target === mobileMenuOverlay) toggleMobileMenu();
    };
}

// Admin mode functions
function toggleAdminMode() {
    if (!isAdminMode) {
        const passcode = prompt("🔐 Enter admin passcode:");
        if (passcode === ADMIN_PASSCODE) {
            activateAdminMode();
        } else if (passcode !== null) {
            alert("❌ Incorrect passcode!");
        }
    } else {
        deactivateAdminMode();
    }
}

function activateAdminMode() {
    isAdminMode = true;
    document.body.classList.add('admin-mode');
    if (adminPanel) adminPanel.classList.add('active');
    
    // Show delete buttons and job IDs
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.classList.add('admin-visible');
    });
    
    document.querySelectorAll('.job-id').forEach(id => {
        id.classList.add('admin-visible');
    });
    
    document.querySelectorAll('.job-card').forEach(card => {
        card.classList.add('admin-mode');
    });

    updateAdminStats();
    console.log("🔐 Admin mode activated");
}

function deactivateAdminMode() {
    isAdminMode = false;
    document.body.classList.remove('admin-mode');
    if (adminPanel) adminPanel.classList.remove('active');
    
    // Hide delete buttons and job IDs
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.classList.remove('admin-visible');
    });
    
    document.querySelectorAll('.job-id').forEach(id => {
        id.classList.remove('admin-visible');
    });
    
    document.querySelectorAll('.job-card').forEach(card => {
        card.classList.remove('admin-mode');
    });

    console.log("🔓 Admin mode deactivated");
}

function updateAdminStats() {
    if (isAdminMode) {
        const totalJobs = document.querySelectorAll('.job-card').length;
        const totalJobsSpan = document.getElementById('totalJobs');
        const sessionDeletionsSpan = document.getElementById('sessionDeletions');
        
        if (totalJobsSpan) totalJobsSpan.textContent = totalJobs;
        if (sessionDeletionsSpan) sessionDeletionsSpan.textContent = sessionDeletions;
    }
}

// Mobile menu toggle
function toggleMobileMenu() {
    if (mobileMenuOverlay) {
        const isActive = mobileMenuOverlay.classList.contains('active');
        if (isActive) {
            mobileMenuOverlay.classList.remove('active');
            document.body.style.overflow = 'auto';
        } else {
            mobileMenuOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }
}

// Job posting modal functions
function openJobModal(mode = 'detailed') {
    switchPostingMode(mode);
    if (modal) {
        modal.style.display = "flex";
        document.body.style.overflow = "hidden";
    }
}

function closeJobModal() {
    if (modal) {
        modal.style.display = "none";
        document.body.style.overflow = "auto";
        clearForm();
        hideMessages();
    }
}

function switchPostingMode(mode) {
    currentPostingMode = mode;
    
    const detailedModeBtn = document.getElementById('detailedModeBtn');
    const quickModeBtn = document.getElementById('quickModeBtn');
    const detailedForm = document.getElementById('detailedForm');
    const quickForm = document.getElementById('quickForm');
    
    if (mode === 'detailed') {
        if (detailedModeBtn) detailedModeBtn.classList.add('active');
        if (quickModeBtn) quickModeBtn.classList.remove('active');
        if (detailedForm) detailedForm.style.display = 'block';
        if (quickForm) quickForm.style.display = 'none';
    } else {
        if (quickModeBtn) quickModeBtn.classList.add('active');
        if (detailedModeBtn) detailedModeBtn.classList.remove('active');
        if (detailedForm) detailedForm.style.display = 'none';
        if (quickForm) quickForm.style.display = 'block';
    }
}

function switchToQuickPost() {
    openJobModal('quick');
}

// Application modal functions
function openApplicationModal(jobId, jobTitle, company, location) {
    currentApplication = { jobId, jobTitle, company, location };
    
    const jobDetails = document.getElementById('applicationJobDetails');
    if (jobDetails) {
        jobDetails.innerHTML = `
            <h3>${escapeHtml(jobTitle)}</h3>
            <div class="company">${escapeHtml(company)}</div>
            ${location ? `<div class="location">📍 ${escapeHtml(location)}</div>` : ''}
        `;
    }
    
    if (applicationModal) {
        applicationModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    // Track application start
    if (typeof gtag !== 'undefined') {
        gtag('event', 'apply_start', {
            job_title: jobTitle,
            company: company
        });
    }
}

function closeApplicationModal() {
    if (applicationModal) {
        applicationModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
    currentApplication = null;
}

function closeAllModals() {
    closeJobModal();
    closeApplicationModal();
    toggleMobileMenu();
    if (confirmModal && confirmModal.style.display === 'flex') {
        cancelJobDelete();
    }
}

// Search functionality
function performSearch(event) {
    event.preventDefault();
    
    const jobSearch = document.getElementById('jobSearch');
    const categorySelect = document.getElementById('categorySelect');
    const locationSelect = document.getElementById('locationSelect');
    
    const searchTerm = jobSearch ? jobSearch.value.trim() : '';
    const category = categorySelect ? categorySelect.value : '';
    const location = locationSelect ? locationSelect.value : '';
    
    // Filter jobs
    filterJobs(searchTerm, category, location);
    
    // Track search
    if (typeof gtag !== 'undefined') {
        gtag('event', 'search', {
            search_term: searchTerm,
            location: location,
            category: category
        });
    }
    
    // Scroll to results
    if (jobsList) {
        jobsList.scrollIntoView({ behavior: 'smooth' });
    }
}

// Filter jobs function
function filterJobs(searchTerm, category, location) {
    const allJobs = getAllJobs(); // Get current jobs from memory
    
    const filtered = allJobs.filter(job => {
        const matchesSearch = !searchTerm || 
            job.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.description.toLowerCase().includes(searchTerm.toLowerCase());
            
        const matchesCategory = !category || job.category === category;
        const matchesLocation = !location || (job.location && job.location.includes(location));
        
        return matchesSearch && matchesCategory && matchesLocation;
    });
    
    renderJobs(filtered);
    updateQatarStats(filtered);
}

// Load jobs from database
async function loadJobs() {
    if (jobsList) {
        jobsList.innerHTML = '<div class="loading"><div class="spinner"></div><span>Loading Qatar jobs...</span></div>';
    }

    let jobs = [];
    
    if (isSupabaseConnected) {
        try {
            console.log("Fetching jobs from Supabase...");
            const result = await supabase
                .from("jobs")
                .select("*")
                .order("created_at", { ascending: false });

            if (result.error) {
                console.error("Supabase fetch error:", result.error);
                jobs = demoJobs.slice();
            } else {
                console.log("Supabase jobs fetched:", result.data ? result.data.length : 0);
                jobs = result.data || [];
                
                if (jobs.length === 0) {
                    console.log("No jobs in database, using demo data");
                    jobs = demoJobs.slice();
                }
            }
        } catch (error) {
            console.error("Database connection error:", error);
            jobs = demoJobs.slice();
        }
    } else {
        await new Promise(resolve => setTimeout(resolve, 1000));
        jobs = demoJobs.slice();
        console.log("Demo mode: Loaded", jobs.length, "jobs");
    }

    // Store jobs globally for filtering
    window.currentJobs = jobs;
    
    renderJobs(jobs);
    updateQatarStats(jobs);
    updateQatarCategories(jobs);
    updateAdminStats();
}

// Get current jobs from memory
function getAllJobs() {
    return window.currentJobs || demoJobs;
}

// Render jobs on page
function renderJobs(jobs) {
    if (!jobsList) return;
    
    if (!jobs || jobs.length === 0) {
        jobsList.innerHTML = '<div style="text-align:center;padding:40px;color:#888;"><h3>No jobs found</h3><p>Try adjusting your search criteria or check back later!</p></div>';
        return;
    }

    const jobsContainer = document.createElement('div');
    jobsContainer.className = 'jobs-container';

    jobs.forEach((job, index) => {
        const div = document.createElement("div");
        div.className = "job-card fade-in";
        div.style.animationDelay = (index * 0.1) + 's';
        if (isAdminMode) {
            div.classList.add('admin-mode');
        }
        
        const salaryHtml = job.salary ? `<div class="salary-badge">${escapeHtml(job.salary)}</div>` : "";
        const locationHtml = job.location ? `<div class="job-location">📍 ${escapeHtml(job.location)}</div>` : "";
        const contactHtml = job.contact ? `<div class="meta-item">📧 ${escapeHtml(job.contact)}</div>` : "";
        const posterHtml = job.poster_url ? `<img src="${escapeHtml(job.poster_url)}" class="job-poster" alt="Job Poster" loading="lazy">` : "";
        const imageOnlyBadge = job.is_image_only ? '<div class="image-only-badge">📷 Image Post</div>' : '';
        const tags = generateJobTags(job);
        
        // For image-only posts, show minimal text info
        let jobContent = '';
        if (job.is_image_only) {
            jobContent = `
                <h3 class="job-title">${escapeHtml(job.position || 'Job Opportunity')} - ${escapeHtml(job.company || 'Company')}</h3>
                <div class="job-company">${escapeHtml(job.company)}</div>
                ${locationHtml}
                <p class="job-description">📋 See image for full job details</p>
            `;
        } else {
            jobContent = `
                <div class="job-header">
                    <div class="job-info">
                        <h3 class="job-title">${escapeHtml(job.position)}</h3>
                        <div class="job-company">${escapeHtml(job.company)}</div>
                        ${locationHtml}
                    </div>
                    ${salaryHtml}
                </div>
                <p class="job-description">${escapeHtml(job.description)}</p>
            `;
        }
        
        div.innerHTML = `
            <div class="job-id ${isAdminMode ? 'admin-visible' : ''}">ID: ${job.id}</div>
            ${imageOnlyBadge}
            ${jobContent}
            <div class="job-tags">${tags}</div>
            ${posterHtml}
            <div class="job-footer">
                <div class="job-date">${formatDate(job.created_at)}</div>
                <div class="job-actions">
                    <button class="apply-btn" onclick="openApplicationModal(${job.id}, '${escapeHtml(job.position)}', '${escapeHtml(job.company)}', '${escapeHtml(job.location || '')}')">Apply Now</button>
                    <button class="delete-btn ${isAdminMode ? 'admin-visible' : ''}" onclick="initiateDelete(${job.id}, '${escapeHtml(job.position || 'Job Opportunity')}', '${escapeHtml(job.company || 'Company')}')">🗑️ Delete</button>
                </div>
            </div>
        `;
        
        jobsContainer.appendChild(div);
    });

    jobsList.innerHTML = '';
    jobsList.appendChild(jobsContainer);
}

// Generate job tags based on category and content
function generateJobTags(job) {
    const tags = [job.category || 'General'];
    
    // Add additional tags based on content
    const description = (job.description || '').toLowerCase();
    const position = (job.position || '').toLowerCase();
    
    if (description.includes('remote') || description.includes('work from home')) {
        tags.push('Remote OK');
    }
    if (description.includes('benefit') || description.includes('insurance')) {
        tags.push('Benefits');
    }
    if (description.includes('urgent') || description.includes('immediate')) {
        tags.push('Urgent');
    }
    if (description.includes('experience') || description.includes('senior')) {
        tags.push('Experience Required');
    }
    if (description.includes('entry') || description.includes('fresh') || description.includes('graduate')) {
        tags.push('Entry Level');
    }
    if (position.includes('manager') || position.includes('lead')) {
        tags.push('Leadership');
    }
    if (description.includes('arabic') || description.includes('bilingual')) {
        tags.push('Arabic Plus');
    }
    
    return tags.slice(0, 3).map(tag => `<span class="job-tag">${escapeHtml(tag)}</span>`).join('');
}

// Update Qatar stats
function updateQatarStats(jobs) {
    const totalJobs = jobs.length;
    const uniqueCompanies = new Set(jobs.map(job => job.company)).size;
    const estimatedSeekers = Math.max(totalJobs * 15, 1247); // Ensure minimum numbers
    
    // Animate numbers
    animateNumber('activeJobs', Math.max(totalJobs * 20, 1247));
    animateNumber('totalCompanies', Math.max(uniqueCompanies * 10, 562));
    animateNumber('jobSeekers', Math.max(estimatedSeekers, 8934));
}

// Animate number counters
function animateNumber(elementId, target) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    let current = 0;
    const increment = Math.max(1, Math.ceil(target / 50));
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = current.toLocaleString();
    }, 40);
}

// Update Qatar categories
function updateQatarCategories(jobs) {
    const categoryCounts = {};
    
    // Count jobs by category
    jobs.forEach(job => {
        const category = job.category || 'Others';
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
    
    // Update category objects
    qatarCategories.forEach(cat => {
        cat.count = (categoryCounts[cat.name] || 0) * 15; // Simulate larger numbers
    });
    
    // Render categories
    renderQatarCategories();
}

// Render Qatar categories
function renderQatarCategories() {
    const container = document.getElementById('categoriesGrid');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Show categories with jobs, sorted by count
    const activeCategories = qatarCategories
        .filter(cat => cat.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 6); // Show top 6 categories
    
    // If no jobs, show default categories
    if (activeCategories.length === 0) {
        const defaultCategories = qatarCategories.slice(0, 6);
        defaultCategories.forEach(cat => {
            cat.count = Math.floor(Math.random() * 50) + 20; // Random counts for demo
        });
        activeCategories.push(...defaultCategories);
    }
    
    activeCategories.forEach(category => {
        const card = document.createElement('div');
        card.className = 'category-card';
        card.onclick = () => filterByCategory(category.name);
        
        card.innerHTML = `
            <span class="category-icon">${category.icon}</span>
            <div class="category-name">${category.label}</div>
            <div class="category-count">${category.count} job${category.count !== 1 ? 's' : ''}</div>
        `;
        
        container.appendChild(card);
    });
}

// Filter jobs by category
function filterByCategory(category) {
    const categoryFilter = document.getElementById('categorySelect');
    if (categoryFilter) {
        categoryFilter.value = category;
        
        // Trigger search with category filter
        const event = new Event('submit');
        const searchForm = document.querySelector('.search-form');
        if (searchForm) {
            searchForm.dispatchEvent(event);
        }
    }
}

// Animate stats on scroll
function animateStatsOnScroll() {
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                // Trigger stats animation
                setTimeout(() => {
                    updateQatarStats(getAllJobs());
                }, 300);
                observer.unobserve(entry.target);
            }
        });
    });

    const statsSection = document.querySelector('.stats-section');
    if (statsSection) {
        observer.observe(statsSection);
    }
}

// Enhanced share function with Qatar branding
function shareJobQatar(position, company, description) {
    const qatarText = `🇶🇦 ${position} at ${company}\n\n📋 ${description.substring(0, 100)}${description.length > 100 ? '...' : ''}\n\n🌟 Find more Qatar jobs at: https://halajobsqa.com/\n\n#QatarJobs #MadeInQatar #${company.replace(/\s+/g, '')}`;
    
    if (navigator.share) {
        navigator.share({
            title: `${position} - ${company} | Qatar Jobs`,
            text: qatarText,
            url: window.location.href
        }).then(() => {
            showNotification('Job shared successfully! 📱', 'success');
            trackQatarEvent('share', { job_title: position, company: company });
        }).catch(err => {
            console.log('Share cancelled');
        });
    } else if (navigator.clipboard) {
        navigator.clipboard.writeText(qatarText).then(() => {
            showNotification('Job details copied to clipboard! 📋', 'success');
            trackQatarEvent('copy', { job_title: position, company: company });
        }).catch(() => {
            fallbackCopyText(qatarText);
        });
    } else {
        fallbackCopyText(qatarText);
    }
}

// Fallback copy function
function fallbackCopyText(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showNotification('Job details copied! 📋', 'success');
        } else {
            showNotification('Please manually copy the job details', 'error');
        }
    } catch (err) {
        showNotification('Copy not supported. Please share manually', 'error');
    }
    
    document.body.removeChild(textArea);
}

// Show notification
function showNotification(message, type = 'success') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Track Qatar-specific events
function trackQatarEvent(action, data) {
    if (typeof gtag !== 'undefined') {
        gtag('event', action, {
            event_category: 'qatar_jobs',
            ...data,
            custom_parameter_1: 'qatar_focus'
        });
    }
    console.log(`🇶🇦 Qatar Event: ${action}`, data);
}

// Job deletion functions (Admin only)
function initiateDelete(jobId, position, company) {
    if (!isAdminMode) return;
    
    console.log("Initiating delete for job ID:", jobId);
    
    jobToDelete = parseInt(jobId);
    const jobDetails = document.getElementById('jobDetails');
    if (jobDetails) {
        jobDetails.innerHTML = 
            '<strong>Job ID:</strong> ' + jobId + '<br>' +
            '<strong>Position:</strong> ' + position + '<br>' +
            '<strong>Company:</strong> ' + company;
    }
    
    const deletePasscode = document.getElementById('deletePasscode');
    if (deletePasscode) deletePasscode.value = '';
    
    if (confirmModal) confirmModal.style.display = 'flex';
    
    console.log("Job to delete set to:", jobToDelete, "(type:", typeof jobToDelete, ")");
}

async function confirmDeletion() {
    const enteredPasscode = document.getElementById('deletePasscode');
    if (!enteredPasscode || enteredPasscode.value !== ADMIN_PASSCODE) {
        alert("❌ Incorrect passcode!");
        return;
    }

    if (!jobToDelete) return;

    const confirmBtn = document.getElementById('confirmDelete');
    if (confirmBtn) {
        const originalText = confirmBtn.textContent;
        confirmBtn.textContent = "🔄 Deleting...";
        confirmBtn.disabled = true;

        try {
            let deleteSuccess = false;
            let errorMessage = "";
            
            if (isSupabaseConnected) {
                console.log("Attempting to delete job ID:", jobToDelete, "from Supabase");
                
                const deleteResult = await supabase
                    .from("jobs")
                    .delete()
                    .eq('id', jobToDelete)
                    .select();
                    
                if (deleteResult.error) {
                    console.error("Supabase delete error:", deleteResult.error);
                    errorMessage = "❌ Database error: " + deleteResult.error.message;
                    
                    // Fallback: remove from demo data
                    const originalLength = demoJobs.length;
                    demoJobs = demoJobs.filter(job => job.id != jobToDelete);
                    if (demoJobs.length < originalLength) {
                        deleteSuccess = true;
                        console.log("Fallback: Deleted from local demo data");
                    }
                } else {
                    console.log("Supabase delete successful:", deleteResult.data);
                    deleteSuccess = true;
                    
                    // Also remove from demo data
                    demoJobs = demoJobs.filter(job => job.id != jobToDelete);
                }
            } else {
                // Demo mode deletion
                const originalLength = demoJobs.length;
                demoJobs = demoJobs.filter(job => job.id != jobToDelete);
                deleteSuccess = demoJobs.length < originalLength;
                console.log("Demo mode: Deleted job", jobToDelete, ", remaining jobs:", demoJobs.length);
            }

            if (deleteSuccess) {
                sessionDeletions++;
                console.log("🗑️ Admin deleted job ID:", jobToDelete, "at", new Date().toLocaleString());
                
                // Remove job card from DOM with animation
                const jobCards = document.querySelectorAll('.job-card');
                let cardFound = false;
                
                jobCards.forEach(card => {
                    const jobIdElement = card.querySelector('.job-id');
                    if (jobIdElement && jobIdElement.textContent.includes('ID: ' + jobToDelete)) {
                        cardFound = true;
                        card.style.transition = 'all 0.5s ease';
                        card.style.transform = 'translateX(-100%)';
                        card.style.opacity = '0';
                        setTimeout(() => {
                            if (card.parentNode) {
                                card.parentNode.removeChild(card);
                                updateAdminStats();
                            }
                        }, 500);
                    }
                });
                
                if (!cardFound) {
                    console.log("Job card not found in DOM, forcing reload");
                    setTimeout(() => { loadJobs(); }, 100);
                }
                
                cancelJobDelete();
                showDeletionSuccess();
                
            } else {
                console.error("Deletion failed:", errorMessage);
                alert(errorMessage || "❌ Failed to delete job. It may have already been deleted or you don't have permission.");
            }

        } catch (error) {
            console.error("Unexpected error during deletion:", error);
            alert("❌ Unexpected error: " + error.message);
        } finally {
            if (confirmBtn) {
                confirmBtn.textContent = originalText;
                confirmBtn.disabled = false;
            }
        }
    }
}

function showDeletionSuccess() {
    const successDiv = document.createElement('div');
    successDiv.style.cssText = 
        'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);' +
        'background: #28a745; color: white; padding: 15px 25px; border-radius: 10px;' +
        'z-index: 3001; font-weight: bold; box-shadow: 0 10px 30px rgba(40,167,69,0.3);' +
        'animation: slideInSuccess 0.3s ease;';
    successDiv.textContent = '✅ Job deleted successfully!';
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        if (document.body.contains(successDiv)) {
            successDiv.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                if (document.body.contains(successDiv)) {
                    document.body.removeChild(successDiv);
                }
            }, 300);
        }
    }, 2000);
}

function cancelJobDelete() {
    if (confirmModal) confirmModal.style.display = 'none';
    jobToDelete = null;
    const deletePasscode = document.getElementById('deletePasscode');
    if (deletePasscode) deletePasscode.value = '';
}

// Job posting functions
async function addJob() {
    if (currentPostingMode === 'detailed') {
        await addDetailedJob();
    } else {
        await addQuickJob();
    }
}

async function addDetailedJob() {
    const position = document.getElementById("position");
    const description = document.getElementById("description");
    const salary = document.getElementById("salary");
    const company = document.getElementById("company");
    const location = document.getElementById("location");
    const category = document.getElementById("category");
    const contact = document.getElementById("contact");
    const poster = document.getElementById("poster");

    if (!position || !description || !company || !category) {
        showError("Please fill in all required fields (marked with *)");
        return;
    }

    if (!position.value.trim() || !description.value.trim() || !company.value.trim() || !category.value) {
        showError("Please fill in all required fields (marked with *)");
        return;
    }

    if (contact && contact.value && !isValidEmail(contact.value)) {
        showError("Please enter a valid email address");
        return;
    }

    await processJobSubmission({
        position: position.value.trim(),
        description: description.value.trim(),
        salary: salary.value.trim() || null,
        company: company.value.trim(),
        location: location.value.trim() || null,
        category: category.value,
        contact: contact.value.trim() || null,
        is_image_only: false
    }, poster.files[0]);
}

async function addQuickJob() {
    const poster = document.getElementById("quickPoster");
    
    if (!poster || !poster.files[0]) {
        showError("Please upload a job poster image");
        return;
    }

    const quickTitle = document.getElementById("quickTitle");
    const quickCompany = document.getElementById("quickCompany");
    const quickCategory = document.getElementById("quickCategory");

    await processJobSubmission({
        position: quickTitle.value.trim() || "Job Opportunity",
        description: "Please see the attached image for complete job details and requirements.",
        salary: null,
        company: quickCompany.value.trim() || "Company",
        location: null,
        category: quickCategory.value || "Others",
        contact: null,
        is_image_only: true
    }, poster.files[0]);
}

async function processJobSubmission(jobData, poster) {
    const submitBtn = document.getElementById("submitJob");
    if (!submitBtn) return;
    
    submitBtn.disabled = true;
    submitBtn.textContent = "🔄 Posting...";
    hideMessages();

    try {
        let poster_url = null;
        
        if (poster && isSupabaseConnected && supabase.storage) {
            try {
                const fileExt = poster.name.split('.').pop();
                const fileName = Date.now() + '-' + Math.random().toString(36).substr(2, 9) + '.' + fileExt;
                
                const uploadResult = await supabase.storage
                    .from("posters")
                    .upload(fileName, poster);
                    
                if (!uploadResult.error && uploadResult.data) {
                    const publicUrlResult = supabase.storage
                        .from("posters")
                        .getPublicUrl(fileName);
                    poster_url = publicUrlResult.data ? publicUrlResult.data.publicUrl : null;
                }
            } catch (storageError) {
                console.warn("File upload failed:", storageError.message);
            }
        } else if (poster) {
            // Create local URL for demo mode
            poster_url = URL.createObjectURL(poster);
        }

        const newJob = {
            ...jobData,
            poster_url: poster_url,
            created_at: new Date().toISOString(),
            expiry_timestamp: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };

        if (isSupabaseConnected) {
            try {
                const insertResult = await supabase.from("jobs").insert([newJob]);
                if (insertResult.error) throw insertResult.error;
            } catch (dbError) {
                console.error("Database insert failed:", dbError);
                newJob.id = Math.max(...demoJobs.map(j => j.id), 0) + 1;
                demoJobs.unshift(newJob);
            }
        } else {
            newJob.id = Math.max(...demoJobs.map(j => j.id), 0) + 1;
            demoJobs.unshift(newJob);
        }

        showSuccess("Job posted successfully! 🎉");
        
        setTimeout(() => {
            closeJobModal();
            loadJobs();
        }, 2000);

    } catch (error) {
        console.error("Error posting job:", error);
        showError("Failed to post job. Please try again.");
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Post Job";
    }
}

// Load more jobs function
function loadMoreJobs() {
    // This would typically load more jobs from the database
    // For demo purposes, we'll just show a message
    showNotification("Loading more jobs... 🔄", 'success');
    
    // Track load more event
    if (typeof gtag !== 'undefined') {
        gtag('event', 'load_more_jobs', {
            event_category: 'qatar_jobs'
        });
    }
}

// File upload handlers
function setupFileUploadHandlers() {
    // Regular file input
    const poster = document.getElementById('poster');
    if (poster) {
        poster.onchange = function() {
            const fileName = this.files[0] ? this.files[0].name : 'Click to upload job poster (optional)';
            const fileInput = document.querySelector('.file-input');
            if (fileInput) {
                fileInput.textContent = this.files[0] ? '📁 ' + fileName : 'Click to upload job poster (optional)';
            }
        };
    }

    // Quick upload zone
    const quickUploadZone = document.getElementById('quickUploadZone');
    const quickPoster = document.getElementById('quickPoster');
    const quickImagePreview = document.getElementById('quickImagePreview');

    if (quickUploadZone && quickPoster) {
        quickUploadZone.onclick = () => quickPoster.click();

        quickUploadZone.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.stopPropagation();
            quickUploadZone.classList.add('dragover');
        });

        quickUploadZone.addEventListener('dragleave', function(e) {
            e.preventDefault();
            e.stopPropagation();
            quickUploadZone.classList.remove('dragover');
        });

        quickUploadZone.addEventListener('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
            quickUploadZone.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type.startsWith('image/')) {
                handleQuickImageUpload(files[0], quickPoster, quickUploadZone, quickImagePreview);
            }
        });

        quickPoster.onchange = function() {
            if (this.files[0]) {
                handleQuickImageUpload(this.files[0], quickPoster, quickUploadZone, quickImagePreview);
            }
        };
    }
}

function handleQuickImageUpload(file, input, zone, preview) {
    const reader = new FileReader();
    reader.onload = function(e) {
        if (preview) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        }
        if (zone) {
            zone.innerHTML = '<p style="color: #28a745; font-weight: bold;">✅ Image uploaded successfully!</p><p style="font-size: 12px;">Click to change image</p>';
        }
        
        // Try to extract basic info from filename
        const filename = file.name.toLowerCase();
        extractTitleFromFilename(filename);
    };
    reader.readAsDataURL(file);
    
    // Set the file to the input
    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
}

function extractTitleFromFilename(filename) {
    const titleInput = document.getElementById('quickTitle');
    const categorySelect = document.getElementById('quickCategory');
    
    if (!titleInput || !categorySelect) return;
    
    // Extract potential job titles
    if (filename.includes('driver')) {
        titleInput.value = 'Driver';
        categorySelect.value = 'Driver';
    } else if (filename.includes('engineer')) {
        titleInput.value = 'Engineer';
        categorySelect.value = 'Engineer';
    } else if (filename.includes('helper')) {
        titleInput.value = 'Helper';
        categorySelect.value = 'Helper';
    } else if (filename.includes('delivery')) {
        titleInput.value = 'Delivery';
        categorySelect.value = 'Delivery';
    } else if (filename.includes('sales')) {
        titleInput.value = 'Sales';
        categorySelect.value = 'Sales';
    } else if (filename.includes('construction')) {
        titleInput.value = 'Construction Worker';
        categorySelect.value = 'Construction';
    } else if (filename.includes('technician')) {
        titleInput.value = 'Technician';
        categorySelect.value = 'Technician';
    }
}

// Form management functions
function clearForm() {
    const inputs = document.querySelectorAll(".modal-content input, .modal-content textarea, .modal-content select");
    inputs.forEach(el => {
        if (el.type !== 'file') {
            el.value = "";
        }
    });
    
    const poster = document.getElementById('poster');
    const quickPoster = document.getElementById('quickPoster');
    const fileInput = document.querySelector('.file-input');
    const quickUploadZone = document.getElementById('quickUploadZone');
    const quickImagePreview = document.getElementById('quickImagePreview');
    
    if (poster) poster.value = "";
    if (quickPoster) quickPoster.value = "";
    if (fileInput) fileInput.textContent = '📁 Click to upload job poster (optional)';
    if (quickImagePreview) quickImagePreview.style.display = 'none';
    if (quickUploadZone) {
        quickUploadZone.innerHTML = '<h3>📷 Upload Job Poster</h3><p>Drag & drop your job poster here or click to select</p><p style="font-size: 12px; color: #666;">Image should contain all job details</p>';
    }
}

function hideMessages() {
    const successMsg = document.getElementById("successMsg");
    const errorMsg = document.getElementById("errorMsg");
    if (successMsg) successMsg.style.display = "none";
    if (errorMsg) errorMsg.style.display = "none";
}

function showSuccess(message) {
    const successMsg = document.getElementById("successMsg");
    const errorMsg = document.getElementById("errorMsg");
    if (successMsg) {
        successMsg.textContent = message;
        successMsg.style.display = "block";
    }
    if (errorMsg) errorMsg.style.display = "none";
}

function showError(message) {
    const errorMsg = document.getElementById("errorMsg");
    const successMsg = document.getElementById("successMsg");
    if (errorMsg) {
        errorMsg.textContent = message;
        errorMsg.style.display = "block";
    }
    if (successMsg) successMsg.style.display = "none";
}

// Utility functions
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text.toString();
    return div.innerHTML;
}

function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else if (diffDays < 30) {
            const weeks = Math.floor(diffDays / 7);
            return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString('en-GB', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
    } catch (error) {
        return 'Recently';
    }
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Export functions for global access
window.toggleMobileMenu = toggleMobileMenu;
window.openApplicationModal = openApplicationModal;
window.closeApplicationModal = closeApplicationModal;
window.shareJobQatar = shareJobQatar;
window.switchToQuickPost = switchToQuickPost;
window.loadMoreJobs = loadMoreJobs;
window.initiateDelete = initiateDelete;

console.log('🇶🇦 HALAJOBS.QA Complete Qatar Theme Script Loaded!');
