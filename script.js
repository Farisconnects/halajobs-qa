// HALAJOBS.QA - Fixed Qatar Theme Script with Bug Fixes

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

// Global jobs storage
let allJobs = [];
let currentJobsDisplayed = 0;
const JOBS_PER_PAGE = 6;

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
const demoJobs = [
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
        position: "Senior Client Service Representative (HR)",
        company: "Aria holding",
        description: "Looking for experienced HR representative to handle client services and manage HR operations. Must have excellent communication skills and experience in Qatar market.",
        salary: "QR 8,500",
        category: "Sales",
        location: "Head Office - Qatar",
        contact: "hr@aria.qa",
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        poster_url: null,
        is_image_only: false
    },
    {
        id: 3,
        position: "Registered Nurse",
        company: "Hamad Medical Corporation",
        description: "Seeking qualified nurses for our expanding healthcare facilities. Excellent benefits package, professional development opportunities, and competitive salary.",
        salary: "QR 9,200",
        category: "Healthcare",
        location: "Medical City, Doha",
        contact: "hr@hmc.gov.qa",
        created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        poster_url: null,
        is_image_only: false
    },
    {
        id: 4,
        position: "Delivery Driver",
        company: "Qatar Express",
        description: "Flexible working hours with competitive pay and tips. Join Qatar's largest delivery network with benefits and career advancement opportunities.",
        salary: "QR 3,500+",
        category: "Delivery",
        location: "Al Rayyan",
        contact: null,
        created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        poster_url: null,
        is_image_only: false
    },
    {
        id: 5,
        position: "Accountant-2",
        company: "Financial Services Qatar",
        description: "We are seeking a qualified accountant with 3+ years experience in financial management, bookkeeping, and tax preparation. Experience with Qatar taxation laws preferred.",
        salary: "QR 6,500",
        category: "Accountant",
        location: "Doha, QAT",
        contact: "hr@fsqatar.com",
        created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        poster_url: null,
        is_image_only: false
    }
];

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

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    console.log('🇶🇦 HALAJOBS.QA Qatar Theme Loading...');
    
    setupEventListeners();
    loadJobs();
    setupSearch();
    setupJobModal();
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

// FIXED: Setup search functionality
function setupSearch() {
    const searchForm = document.querySelector('.search-form');
    const jobSearchInput = document.getElementById('jobSearch');
    const categorySelect = document.getElementById('categorySelect');
    const locationSelect = document.getElementById('locationSelect');
    
    // Add event listeners for real-time search
    if (jobSearchInput) {
        jobSearchInput.addEventListener('input', debounce(performSearch, 500));
    }
    
    if (categorySelect) {
        categorySelect.addEventListener('change', performSearch);
    }
    
    if (locationSelect) {
        locationSelect.addEventListener('change', performSearch);
    }
    
    // Form submit handler
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            performSearch();
        });
    }
}

// FIXED: Setup job modal
function setupJobModal() {
    const jobModal = document.getElementById('jobModal');
    const closeModal = document.getElementById('closeModal');
    const detailedModeBtn = document.getElementById('detailedModeBtn');
    const quickModeBtn = document.getElementById('quickModeBtn');
    const quickUploadZone = document.getElementById('quickUploadZone');
    const quickPoster = document.getElementById('quickPoster');
    const quickImagePreview = document.getElementById('quickImagePreview');
    const submitJob = document.getElementById('submitJob');

    // Close modal handlers
    if (closeModal) {
        closeModal.addEventListener('click', function() {
            if (jobModal) jobModal.style.display = 'none';
        });
    }

    if (jobModal) {
        jobModal.addEventListener('click', function(e) {
            if (e.target === jobModal) {
                jobModal.style.display = 'none';
            }
        });
    }

    // Mode toggle handlers
    if (detailedModeBtn) {
        detailedModeBtn.addEventListener('click', function() {
            switchToDetailedMode();
        });
    }

    if (quickModeBtn) {
        quickModeBtn.addEventListener('click', function() {
            switchToQuickMode();
        });
    }

    // Quick upload handlers
    if (quickUploadZone && quickPoster) {
        quickUploadZone.addEventListener('click', function() {
            quickPoster.click();
        });

        quickUploadZone.addEventListener('dragover', function(e) {
            e.preventDefault();
            quickUploadZone.style.borderColor = '#d4af37';
            quickUploadZone.style.background = '#f9f9f9';
        });

        quickUploadZone.addEventListener('dragleave', function(e) {
            e.preventDefault();
            quickUploadZone.style.borderColor = '#ddd';
            quickUploadZone.style.background = '#fff';
        });

        quickUploadZone.addEventListener('drop', function(e) {
            e.preventDefault();
            quickUploadZone.style.borderColor = '#ddd';
            quickUploadZone.style.background = '#fff';
            
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type.startsWith('image/')) {
                handleQuickImageUpload(files[0]);
            }
        });

        quickPoster.addEventListener('change', function(e) {
            if (e.target.files.length > 0) {
                handleQuickImageUpload(e.target.files[0]);
            }
        });
    }

    // Submit handler
    if (submitJob) {
        submitJob.addEventListener('click', function(e) {
            e.preventDefault();
            handleJobSubmission();
        });
    }
}

// FIXED: Perform search function
function performSearch(event) {
    if (event) {
        event.preventDefault();
    }
    
    const jobSearchInput = document.getElementById('jobSearch');
    const categorySelect = document.getElementById('categorySelect');
    const locationSelect = document.getElementById('locationSelect');
    
    const searchTerm = jobSearchInput ? jobSearchInput.value.trim().toLowerCase() : '';
    const category = categorySelect ? categorySelect.value : '';
    const location = locationSelect ? locationSelect.value : '';
    
    console.log('🔍 Searching:', { searchTerm, category, location });
    
    // Filter jobs
    const filteredJobs = allJobs.filter(job => {
        const matchesSearch = !searchTerm || 
            (job.position && job.position.toLowerCase().includes(searchTerm)) ||
            (job.company && job.company.toLowerCase().includes(searchTerm)) ||
            (job.description && job.description.toLowerCase().includes(searchTerm)) ||
            (job.location && job.location.toLowerCase().includes(searchTerm));
            
        const matchesCategory = !category || job.category === category;
        const matchesLocation = !location || (job.location && job.location.toLowerCase().includes(location.toLowerCase()));
        
        return matchesSearch && matchesCategory && matchesLocation;
    });
    
    console.log(`📊 Found ${filteredJobs.length} jobs`);
    
    renderJobs(filteredJobs);
    updateQatarStats(filteredJobs);
    
    // Track search
    if (typeof gtag !== 'undefined') {
        gtag('event', 'search', {
            search_term: searchTerm,
            location: location,
            category: category,
            results_count: filteredJobs.length
        });
    }
}

// FIXED: Share job function with proper fallbacks
function shareJob(position, company, description) {
    const qatarText = `🇶🇦 ${position} at ${company}\n\n📋 ${description.substring(0, 100)}${description.length > 100 ? '...' : ''}\n\n🌟 Find more Qatar jobs at: https://halajobsqa.com/\n\n#QatarJobs #MadeInQatar`;
    
    console.log('📱 Sharing job:', position, company);
    
    if (navigator.share) {
        navigator.share({
            title: `${position} - ${company} | Qatar Jobs`,
            text: qatarText,
            url: window.location.href
        }).then(() => {
            showNotification('Job shared successfully! 📱', 'success');
        }).catch(err => {
            console.log('Share cancelled or failed:', err);
            // Fallback to clipboard
            copyToClipboard(qatarText);
        });
    } else {
        // Fallback to clipboard copy
        copyToClipboard(qatarText);
    }
}

// FIXED: Copy to clipboard with better fallbacks
function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showNotification('Job details copied to clipboard! 📋', 'success');
        }).catch(() => {
            fallbackCopyText(text);
        });
    } else {
        fallbackCopyText(text);
    }
}

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
            showNotification('Please manually copy the job details', 'info');
        }
    } catch (err) {
        showNotification('Share: ' + text.substring(0, 50) + '...', 'info');
    }
    
    document.body.removeChild(textArea);
}

// FIXED: Application modal functions
function openApplicationModal(jobId, jobTitle, company, location) {
    console.log('📋 Opening application modal for:', jobTitle, company);
    
    // Ensure we have valid data
    if (!jobId || !jobTitle || !company) {
        console.warn('Invalid job data for application modal');
        showNotification('Invalid job data. Please try again.', 'error');
        return;
    }
    
    currentApplication = { 
        jobId: parseInt(jobId), 
        jobTitle: jobTitle || 'Job Position', 
        company: company || 'Company', 
        location: location || '' 
    };
    
    const modal = document.getElementById('applicationModal');
    const jobDetails = document.getElementById('applicationJobDetails');
    
    if (jobDetails) {
        jobDetails.innerHTML = `
            <h3>${escapeHtml(currentApplication.jobTitle)}</h3>
            <div class="company">${escapeHtml(currentApplication.company)}</div>
            ${currentApplication.location ? `<div class="location">📍 ${escapeHtml(currentApplication.location)}</div>` : ''}
        `;
    }
    
    if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
    
    // Track application start
    if (typeof gtag !== 'undefined') {
        gtag('event', 'apply_start', {
            job_id: currentApplication.jobId,
            job_title: currentApplication.jobTitle,
            company: currentApplication.company
        });
    }
}

function closeApplicationModal() {
    const modal = document.getElementById('applicationModal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    currentApplication = null;
}

// FIXED: Proceed to application
function proceedToApplication() {
    if (!currentApplication) {
        console.warn('No current application data');
        showNotification('Application data not found. Please try again.', 'error');
        return;
    }
    
    console.log('✅ Proceeding with application for:', currentApplication.jobTitle);
    
    // Track application proceed
    if (typeof gtag !== 'undefined') {
        gtag('event', 'apply_proceed', {
            job_id: currentApplication.jobId,
            job_title: currentApplication.jobTitle,
            company: currentApplication.company
        });
    }
    
    closeApplicationModal();
    
    // Find the job in the list and scroll to it
    const jobCards = document.querySelectorAll('.job-card');
    let targetCard = null;
    
    jobCards.forEach(card => {
        const titleElement = card.querySelector('.job-title');
        const companyElement = card.querySelector('.job-company');
        if (titleElement && companyElement) {
            const title = titleElement.textContent.trim();
            const company = companyElement.textContent.trim();
            if (title === currentApplication.jobTitle && company === currentApplication.company) {
                targetCard = card;
            }
        }
    });
    
    if (targetCard) {
        targetCard.style.border = '3px solid #d4af37';
        targetCard.style.boxShadow = '0 0 20px rgba(212, 175, 55, 0.5)';
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        showNotification(`📋 Job details highlighted below. Contact: ${currentApplication.company}`, 'success');
        
        // Remove highlight after 5 seconds
        setTimeout(() => {
            targetCard.style.border = '';
            targetCard.style.boxShadow = '';
        }, 5000);
    } else {
        showNotification('📞 Contact the employer directly for this position', 'info');
    }
}

// FIXED: Load More Jobs function
function loadMoreJobs() {
    console.log('📊 Loading more jobs...');
    
    const remainingJobs = allJobs.length - currentJobsDisplayed;
    if (remainingJobs <= 0) {
        showNotification('No more jobs to load', 'info');
        const loadMoreBtn = document.querySelector('.load-more-btn');
        if (loadMoreBtn) {
            loadMoreBtn.style.display = 'none';
        }
        return;
    }
    
    const nextBatch = allJobs.slice(currentJobsDisplayed, currentJobsDisplayed + JOBS_PER_PAGE);
    appendJobs(nextBatch);
    currentJobsDisplayed += nextBatch.length;
    
    if (currentJobsDisplayed >= allJobs.length) {
        const loadMoreBtn = document.querySelector('.load-more-btn');
        if (loadMoreBtn) {
            loadMoreBtn.textContent = 'All jobs loaded';
            loadMoreBtn.disabled = true;
            setTimeout(() => {
                loadMoreBtn.style.display = 'none';
            }, 2000);
        }
    }
    
    showNotification(`Loaded ${nextBatch.length} more jobs`, 'success');
}

// FIXED: Switch to Quick Post mode
function switchToQuickPost() {
    console.log('📷 Switching to quick post mode');
    
    const jobModal = document.getElementById('jobModal');
    if (jobModal) {
        jobModal.style.display = 'flex';
        switchToQuickMode();
    }
}

// FIXED: Mode switching functions
function switchToDetailedMode() {
    currentPostingMode = 'detailed';
    const detailedForm = document.getElementById('detailedForm');
    const quickForm = document.getElementById('quickForm');
    const detailedModeBtn = document.getElementById('detailedModeBtn');
    const quickModeBtn = document.getElementById('quickModeBtn');
    
    if (detailedForm) detailedForm.style.display = 'block';
    if (quickForm) quickForm.style.display = 'none';
    if (detailedModeBtn) detailedModeBtn.classList.add('active');
    if (quickModeBtn) quickModeBtn.classList.remove('active');
    
    console.log('Switched to detailed mode');
}

function switchToQuickMode() {
    currentPostingMode = 'quick';
    const detailedForm = document.getElementById('detailedForm');
    const quickForm = document.getElementById('quickForm');
    const detailedModeBtn = document.getElementById('detailedModeBtn');
    const quickModeBtn = document.getElementById('quickModeBtn');
    
    if (detailedForm) detailedForm.style.display = 'none';
    if (quickForm) quickForm.style.display = 'block';
    if (detailedModeBtn) detailedModeBtn.classList.remove('active');
    if (quickModeBtn) quickModeBtn.classList.add('active');
    
    console.log('Switched to quick mode');
}

// FIXED: Handle quick image upload
function handleQuickImageUpload(file) {
    if (!file.type.startsWith('image/')) {
        showNotification('Please select an image file', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const quickImagePreview = document.getElementById('quickImagePreview');
        const quickUploadZone = document.getElementById('quickUploadZone');
        
        if (quickImagePreview) {
            quickImagePreview.src = e.target.result;
            quickImagePreview.style.display = 'block';
        }
        
        if (quickUploadZone) {
            quickUploadZone.style.display = 'none';
        }
        
        console.log('Image uploaded successfully');
    };
    reader.readAsDataURL(file);
}

// FIXED: Handle job submission
function handleJobSubmission() {
    console.log('📝 Submitting job...');
    
    let jobData = {};
    
    if (currentPostingMode === 'detailed') {
        // Detailed form submission
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
            is_image_only: false
        };
    } else {
        // Quick form submission
        const quickImagePreview = document.getElementById('quickImagePreview');
        const quickTitle = document.getElementById('quickTitle')?.value?.trim();
        const quickCompany = document.getElementById('quickCompany')?.value?.trim();
        const quickCategory = document.getElementById('quickCategory')?.value;
        
        if (!quickImagePreview || !quickImagePreview.src || quickImagePreview.style.display === 'none') {
            showNotification('Please upload a job poster image', 'error');
            return;
        }
        
        jobData = {
            position: quickTitle || 'Job Position (See Image)',
            description: 'Please see the job poster image for full details.',
            company: quickCompany || 'Company (See Image)',
            category: quickCategory || 'Others',
            poster_url: quickImagePreview.src,
            is_image_only: true
        };
    }
    
    // Add current timestamp
    jobData.created_at = new Date().toISOString();
    jobData.id = Date.now(); // Temporary ID for demo
    
    // Add to jobs list (in a real app, this would be saved to database)
    allJobs.unshift(jobData);
    
    // Show success message
    showNotification('Job posted successfully! 🎉', 'success');
    
    // Close modal and reset form
    const jobModal = document.getElementById('jobModal');
    if (jobModal) {
        jobModal.style.display = 'none';
    }
    
    resetJobForm();
    
    // Refresh job list
    renderJobs(allJobs.slice(0, currentJobsDisplayed + 1));
    currentJobsDisplayed = Math.min(currentJobsDisplayed + 1, allJobs.length);
    
    console.log('Job posted successfully:', jobData);
}

// FIXED: Reset job form
function resetJobForm() {
    // Reset detailed form
    const detailedInputs = ['position', 'description', 'company', 'salary', 'location', 'contact', 'category'];
    detailedInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.value = '';
    });
    
    // Reset quick form
    const quickInputs = ['quickTitle', 'quickCompany', 'quickCategory'];
    quickInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.value = '';
    });
    
    const quickImagePreview = document.getElementById('quickImagePreview');
    const quickUploadZone = document.getElementById('quickUploadZone');
    
    if (quickImagePreview) {
        quickImagePreview.style.display = 'none';
        quickImagePreview.src = '';
    }
    
    if (quickUploadZone) {
        quickUploadZone.style.display = 'block';
    }
    
    // Switch back to detailed mode
    switchToDetailedMode();
}

// Load jobs from database
async function loadJobs() {
    const jobsList = document.getElementById('jobsList');
    
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
                jobs = [...demoJobs];
            } else {
                console.log("Supabase jobs fetched:", result.data ? result.data.length : 0);
                jobs = result.data || [];
                
                if (jobs.length === 0) {
                    console.log("No jobs in database, using demo data");
                    jobs = [...demoJobs];
                }
            }
        } catch (error) {
            console.error("Database connection error:", error);
            jobs = [...demoJobs];
        }
    } else {
        await new Promise(resolve => setTimeout(resolve, 1000));
        jobs = [...demoJobs];
        console.log("Demo mode: Loaded", jobs.length, "jobs");
    }

    // Store jobs globally for filtering
    allJobs = jobs;
    currentJobsDisplayed = Math.min(JOBS_PER_PAGE, jobs.length);
    
    renderJobs(jobs.slice(0, currentJobsDisplayed));
    updateQatarStats(jobs);
    updateQatarCategories(jobs);
    updateAdminStats();
}

// FIXED: Render jobs on page
function renderJobs(jobs, append = false) {
    const jobsList = document.getElementById('jobsList');
    if (!jobsList) return;
    
    if (!jobs || jobs.length === 0) {
        if (!append) {
            jobsList.innerHTML = '<div style="text-align:center;padding:40px;color:#888;"><h3>No jobs found</h3><p>Try adjusting your search criteria or check back later!</p></div>';
        }
        return;
    }

    const jobsContainer = append ? jobsList.querySelector('.jobs-container') : document.createElement('div');
    if (!append) {
        jobsContainer.className = 'jobs-container';
        jobsList.innerHTML = '';
    }

    jobs.forEach((job, index) => {
        const div = document.createElement("div");
        div.className = "job-card fade-in";
        div.style.animationDelay = (index * 0.1) + 's';
        if (isAdminMode) {
            div.classList.add('admin-mode');
        }
        
        const salaryHtml = job.salary ? `<div class="salary-badge">${escapeHtml(job.salary)}</div>` : "";
        const locationHtml = job.location ? `<div class="job-location">📍 ${escapeHtml(job.location)}</div>` : "";
        const posterHtml = job.poster_url ? `<img src="${escapeHtml(job.poster_url)}" class="job-poster" alt="Job Poster" loading="lazy">` : "";
        const imageOnlyBadge = job.is_image_only ? '<div class="image-only-badge">📷 Image Post</div>' : '';
        const tags = generateJobTags(job);
        
        div.innerHTML = `
            <div class="job-id ${isAdminMode ? 'admin-visible' : ''}">ID: ${job.id}</div>
            ${imageOnlyBadge}
            <div class="job-header">
                <div class="job-info">
                    <h3 class="job-title">${escapeHtml(job.position)}</h3>
                    <div class="job-company">${escapeHtml(job.company)}</div>
                    ${locationHtml}
                </div>
                ${salaryHtml}
