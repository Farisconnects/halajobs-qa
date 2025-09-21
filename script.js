// FIXED: Job posting and Supabase integration
console.log('🇶🇦 HALAJOBS.QA - Loading Fixed Version...');

// Configuration
const supabaseUrl = "https://ehoctsjvtfuesqeonlco.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVob2N0c2p2dGZ1ZXNxZW9ubGNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5OTU2ODcsImV4cCI6MjA3MjU3MTY4N30.kGz2t58YXWTwOB_h40dH0GOBLF12FQxKsZnqQ983Xro";

// Admin configuration
const ADMIN_PASSCODE = "451588";
let isAdminMode = false;
let sessionDeletions = 0;
let jobToDelete = null;
let currentPostingMode = 'detailed';

// Initialize Supabase client
let supabase = null;
let isSupabaseConnected = false;

// Global jobs storage
let allJobs = [];
let currentJobsDisplayed = 0;
const JOBS_PER_PAGE = 6;

// FIXED: Initialize Supabase with better error handling
function initializeSupabase() {
    try {
        if (window.supabase && supabaseUrl && supabaseKey) {
            supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
            isSupabaseConnected = true;
            console.log("✅ Supabase connected successfully!");
            
            // Test the connection
            testSupabaseConnection();
        } else {
            throw new Error("Supabase library not loaded");
        }
    } catch (error) {
        console.error("❌ Supabase connection failed:", error.message);
        isSupabaseConnected = false;
        showNotification("Database connection failed - using demo mode", "error");
    }
}

// FIXED: Test Supabase connection
async function testSupabaseConnection() {
    try {
        const { data, error } = await supabase.from('jobs').select('count', { count: 'exact', head: true });
        if (error) {
            console.error("Supabase test failed:", error);
            isSupabaseConnected = false;
        } else {
            console.log("✅ Supabase test successful");
        }
    } catch (error) {
        console.error("Supabase test error:", error);
        isSupabaseConnected = false;
    }
}

// FIXED: Improved job submission with proper Supabase integration
async function handleJobSubmission() {
    console.log('📝 Submitting job...');
    
    let jobData = {};
    
    if (currentPostingMode === 'detailed') {
        const position = document.getElementById('position')?.value?.trim();
        const description = document.getElementById('description')?.value?.trim();
        const company = document.getElementById('company')?.value?.trim();
        const category = document.getElementById('category')?.value;
        
        if (!position || !description || !company || !category) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        jobData = {
            position: position,
            description: description,
            company: company,
            category: category,
            salary: document.getElementById('salary')?.value?.trim() || null,
            location: document.getElementById('location')?.value?.trim() || null,
            contact: document.getElementById('contact')?.value?.trim() || null,
            whatsapp: document.getElementById('whatsapp')?.value?.trim() || null,
            is_image_only: false,
            poster_url: null
        };
    } else {
        const quickImagePreview = document.getElementById('quickImagePreview');
        const quickTitle = document.getElementById('quickTitle')?.value?.trim();
        const quickCompany = document.getElementById('quickCompany')?.value?.trim();
        const quickCategory = document.getElementById('quickCategory')?.value;
        const quickWhatsapp = document.getElementById('quickWhatsapp')?.value?.trim();
        
        if (!quickImagePreview || !quickImagePreview.src || quickImagePreview.style.display === 'none') {
            showNotification('Please upload a job poster image', 'error');
            return;
        }
        
        jobData = {
            position: quickTitle || 'Job Position (See Image)',
            description: 'Please see the job poster image for full details.',
            company: quickCompany || 'Company (See Image)',
            category: quickCategory || 'Others',
            salary: null,
            location: null,
            contact: null,
            whatsapp: quickWhatsapp || null,
            poster_url: quickImagePreview.src,
            is_image_only: true
        };
    }
    
    // Set creation timestamp and temporary ID
    jobData.created_at = new Date().toISOString();
    
    // Show loading state
    const submitBtn = document.getElementById('submitJob');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Posting...';
    submitBtn.disabled = true;
    
    try {
        let savedJob = null;
        
        // Try to save to Supabase first
        if (isSupabaseConnected && supabase) {
            console.log('💾 Saving to Supabase...');
            const { data, error } = await supabase
                .from('jobs')
                .insert([jobData])
                .select()
                .single();
            
            if (error) {
                console.error('Supabase insert error:', error);
                throw new Error('Database save failed');
            }
            
            savedJob = data;
            console.log('✅ Job saved to Supabase:', savedJob);
        } else {
            // Fallback: save locally with generated ID
            savedJob = {
                ...jobData,
                id: Date.now() + Math.floor(Math.random() * 1000)
            };
            console.log('💾 Saving locally (demo mode)');
        }
        
        // Add to local jobs array at the beginning
        allJobs.unshift(savedJob);
        
        // Update display
        currentJobsDisplayed = Math.min(currentJobsDisplayed + 1, allJobs.length);
        renderJobs(allJobs.slice(0, currentJobsDisplayed));
        updateQatarStats(allJobs);
        updateQatarCategories(allJobs);
        
        // Close modal and reset form
        const jobModal = document.getElementById('jobModal');
        if (jobModal) jobModal.style.display = 'none';
        resetJobForm();
        
        showNotification('Job posted successfully! 🎉', 'success');
        
        // Scroll to jobs section
        const jobsList = document.getElementById('jobsList');
        if (jobsList) {
            jobsList.scrollIntoView({ behavior: 'smooth' });
        }
        
    } catch (error) {
        console.error('Error posting job:', error);
        showNotification('Failed to post job. Please try again.', 'error');
    } finally {
        // Reset button state
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// FIXED: Improved job loading with better error handling
async function loadJobs() {
    console.log('📊 Loading jobs...');
    const jobsList = document.getElementById('jobsList');
    if (jobsList) {
        jobsList.innerHTML = '<div class="loading"><div class="spinner"></div><span>Loading Qatar jobs...</span></div>';
    }

    let jobs = [];
    
    if (isSupabaseConnected && supabase) {
        try {
            console.log('📥 Fetching from Supabase...');
            const { data, error } = await supabase
                .from("jobs")
                .select("*")
                .order("created_at", { ascending: false });
            
            if (error) {
                console.error("Supabase fetch error:", error);
                throw new Error('Database fetch failed');
            } else {
                jobs = data || [];
                console.log(`✅ Loaded ${jobs.length} jobs from Supabase`);
                
                // If no jobs in database, use demo data
                if (jobs.length === 0) {
                    jobs = [...demoJobs];
                    console.log('📋 Using demo data (empty database)');
                }
            }
        } catch (error) {
            console.error("Error loading from database:", error);
            jobs = [...demoJobs];
            console.log('📋 Using demo data (error fallback)');
            showNotification("Using demo data - database unavailable", "info");
        }
    } else {
        // Simulate loading delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        jobs = [...demoJobs];
        console.log('📋 Using demo data (no connection)');
    }

    allJobs = jobs;
    currentJobsDisplayed = Math.min(JOBS_PER_PAGE, jobs.length);
    
    renderJobs(jobs.slice(0, currentJobsDisplayed));
    updateQatarStats(jobs);
    updateQatarCategories(jobs);
    updateAdminStats();
    
    console.log(`📊 Displayed ${currentJobsDisplayed} of ${jobs.length} jobs`);
}

// FIXED: Improved job rendering with better error handling
function renderJobs(jobs, append = false) {
    const jobsList = document.getElementById('jobsList');
    if (!jobsList) {
        console.error('Jobs list container not found');
        return;
    }
    
    if (!jobs || jobs.length === 0) {
        if (!append) {
            jobsList.innerHTML = `
                <div style="text-align:center;padding:40px;color:#888;">
                    <h3>No jobs found</h3>
                    <p>Try adjusting your search criteria or check back later!</p>
                    <button onclick="loadJobs()" class="reload-btn" style="margin-top:16px;padding:12px 24px;background:#10b981;color:white;border:none;border-radius:8px;cursor:pointer;">
                        🔄 Reload Jobs
                    </button>
                </div>`;
        }
        return;
    }

    const jobsContainer = append ? jobsList.querySelector('.jobs-container') : document.createElement('div');
    if (!append) {
        jobsContainer.className = 'jobs-container';
        jobsList.innerHTML = '';
    }

    jobs.forEach((job, index) => {
        if (!job || !job.position || !job.company) {
            console.warn('Invalid job data:', job);
            return;
        }
        
        const div = document.createElement("div");
        div.className = "job-card fade-in";
        div.style.animationDelay = (index * 0.1) + 's';
        if (isAdminMode) {
            div.classList.add('admin-mode');
        }
        
        // Safely extract and escape job data
        const jobTitle = escapeHtml(String(job.position || '').trim());
        const jobCompany = escapeHtml(String(job.company || '').trim());
        const jobLocation = escapeHtml(String(job.location || '').trim());
        const jobDescription = escapeHtml(String(job.description || ''));
        const jobSalary = escapeHtml(String(job.salary || '').trim());
        const jobContact = escapeHtml(String(job.contact || '').trim());
        const jobWhatsapp = escapeHtml(String(job.whatsapp || '').trim());
        const jobId = parseInt(job.id) || Math.floor(Math.random() * 10000);
        
        const salaryHtml = job.salary ? `<div class="salary-badge">${jobSalary}</div>` : "";
        const locationHtml = job.location ? `<div class="job-location">📍 ${jobLocation}</div>` : "";
        const posterHtml = job.poster_url ? `<img src="${escapeHtml(job.poster_url)}" class="job-poster" alt="Job Poster" loading="lazy">` : "";
        const imageOnlyBadge = job.is_image_only ? '<div class="image-only-badge">📷 Image Post</div>' : '';
        const tags = generateJobTags(job);
        
        // Build contact methods
        const contactMethods = [];
        if (job.contact && job.contact.trim()) {
            contactMethods.push(`
                <div class="contact-method">
                    <span class="contact-icon">📧</span>
                    <div class="contact-details">
                        <strong>Email:</strong>
                        <a href="mailto:${jobContact}" class="contact-link">
                            ${jobContact}
                        </a>
                    </div>
                </div>
            `);
        }
        if (job.whatsapp && job.whatsapp.trim()) {
            const whatsappNumber = job.whatsapp.replace(/\s+/g, '');
            const whatsappLink = `https://wa.me/${whatsappNumber.replace(/[^\d]/g, '')}`;
            contactMethods.push(`
                <div class="contact-method">
                    <span class="contact-icon">📱</span>
                    <div class="contact-details">
                        <strong>WhatsApp:</strong>
                        <a href="${whatsappLink}" target="_blank" class="contact-link whatsapp-link">
                            ${jobWhatsapp}
                        </a>
                    </div>
                </div>
            `);
        }
        
        const contactHtml = contactMethods.length > 0 ? 
            `<div class="job-contact-section">
                <h4>📞 How to Apply</h4>
                <div class="contact-methods">
                    ${contactMethods.join('')}
                </div>
                <div class="contact-note">
                    <p><strong>💡 Application Tips:</strong> Be professional, mention the job title, and include your relevant experience when contacting the employer.</p>
                </div>
            </div>` : 
            `<div class="job-contact-section">
                <h4>📞 How to Apply</h4>
                <div class="no-contact-info">
                    <p>Contact information not provided. Please apply through the company's website or visit their office directly.</p>
                    ${job.location ? `<p><strong>Office Location:</strong> ${jobLocation}</p>` : ''}
                </div>
            </div>`;
        
        div.innerHTML = `
            <div class="job-id ${isAdminMode ? 'admin-visible' : ''}">ID: ${jobId}</div>
            ${imageOnlyBadge}
            
            <div class="job-header">
                <div class="job-info">
                    <h3 class="job-title">${jobTitle}</h3>
                    <div class="job-company">${jobCompany}</div>
                    ${locationHtml}
                </div>
                ${salaryHtml}
            </div>
            
            <div class="job-description-section">
                <h4>📋 Job Description</h4>
                <div class="job-description">${jobDescription || 'No detailed description provided.'}</div>
            </div>
            
            <div class="job-tags">${tags}</div>
            ${posterHtml}
            
            ${contactHtml}
            
            <div class="job-footer">
                <div class="job-date">📅 Posted ${formatDate(job.created_at)}</div>
                <div class="job-actions">
                    <button class="share-btn" 
                        data-job-title="${jobTitle}" 
                        data-job-company="${jobCompany}" 
                        data-job-description="${jobDescription}" 
                        data-job-salary="${jobSalary}" 
                        data-job-location="${jobLocation}" 
                        data-job-contact="${jobContact}" 
                        data-job-whatsapp="${jobWhatsapp}">
                        📤 Share Job
                    </button>
                    <button class="delete-btn ${isAdminMode ? 'admin-visible' : ''}" 
                        data-job-id="${jobId}" 
                        data-job-title="${jobTitle}" 
                        data-job-company="${jobCompany}">
                        🗑️ Delete
                    </button>
                </div>
            </div>
        `;
        
        jobsContainer.appendChild(div);
    });

    if (!append) {
        jobsList.appendChild(jobsContainer);
        addJobActionListeners();
    } else {
        addJobActionListeners();
    }
}

// FIXED: Add refresh functionality
function refreshJobs() {
    console.log('🔄 Refreshing jobs...');
    loadJobs();
}

// Demo data with complete contact information (keeping existing data)
const demoJobs = [
    {
        id: 1,
        position: "Senior Software Engineer",
        company: "Tech Qatar Solutions",
        description: "Join our innovative team building next-generation solutions for Qatar's digital transformation. We're looking for experienced developers with React, Node.js, and cloud technologies expertise. Benefits include health insurance, annual bonus, and flexible working hours.",
        salary: "QR 12,000",
        category: "IT",
        location: "West Bay, Doha",
        contact: "careers@techqatar.com",
        whatsapp: "+974 5555 1234",
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        poster_url: null,
        is_image_only: false
    },
    {
        id: 2,
        position: "Sales Coordinator",
        company: "Qatar National Plastic Factory",
        description: "Looking for experienced sales coordinator to handle client relations and manage sales operations. Must have excellent communication skills and experience in Qatar market. Responsible for client meetings, sales reports, and team coordination.",
        salary: "QR 8,500",
        category: "Sales",
        location: "Doha, QAT",
        contact: "hr@qnpf.com",
        whatsapp: "+974 3333 5678",
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        poster_url: null,
        is_image_only: false
    },
    {
        id: 3,
        position: "Registered Nurse",
        company: "Hamad Medical Corporation",
        description: "Seeking qualified nurses for our expanding healthcare facilities. Excellent benefits package, professional development opportunities, and competitive salary. Must have valid nursing license and 2+ years experience.",
        salary: "QR 9,200",
        category: "Healthcare",
        location: "Medical City, Doha",
        contact: "hr@hmc.gov.qa",
        whatsapp: "+974 4444 9876",
        created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        poster_url: null,
        is_image_only: false
    },
    {
        id: 4,
        position: "Delivery Driver",
        company: "Qatar Express",
        description: "Flexible working hours with competitive pay and tips. Join Qatar's largest delivery network with benefits and career advancement opportunities. Must have valid Qatar driving license.",
        salary: "QR 3,500+",
        category: "Delivery",
        location: "Al Rayyan",
        contact: "jobs@qatarexpress.com",
        whatsapp: "+974 7777 3333",
        created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        poster_url: null,
        is_image_only: false
    }
];

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    console.log('🇶🇦 HALAJOBS.QA Loading Fixed Version...');
    initializeSupabase();
    setupEventListeners();
    loadJobs();
    animateStatsOnScroll();
    console.log('🚀 HALAJOBS.QA Loaded Successfully!');
});

// Add the rest of the utility functions...
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text.toString();
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return 'Recently';
    
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

function showNotification(message, type = 'success') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        font-weight: 600;
        z-index: 10001;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
        font-size: 14px;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Generate job tags (keeping existing function)
function generateJobTags(job) {
    if (!job) return '';
    
    const tags = [job.category || 'General'];
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
    if (position.includes('senior') || description.includes('experience')) {
        tags.push('Experience Required');
    }
    if (position.includes('manager') || position.includes('lead')) {
        tags.push('Leadership');
    }
    
    return tags.slice(0, 3).map(tag => `<span class="job-tag">${escapeHtml(tag)}</span>`).join('');
}

// Export the main functions
window.handleJobSubmission = handleJobSubmission;
window.loadJobs = loadJobs;
window.refreshJobs = refreshJobs;

console.log('✅ HALAJOBS.QA - Fixed Script Loaded Successfully!');
