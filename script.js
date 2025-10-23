// HALAJOBS.QA - Complete Script with LinkedIn-Style URL Previews
console.log('🇶🇦 HALAJOBS.QA - Loading Enhanced Version...');

// Configuration
const supabaseUrl = "https://ehoctsjvtfuesqeonlco.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVob2N0c2p2dGZ1ZXNxZW9ubGNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5OTU2ODcsImV4cCI6MjA3MjU3MTY4N30.kGz2t58YXWTwOB_h40dH0GOBLF12FQxKsZnqQ983Xro";

// Admin configuration
const ADMIN_PASSCODE = "451588";
let isAdminMode = false;
let sessionDeletions = 0;
let jobToDelete = null;

// Initialize Supabase client
let supabase = null;
let isSupabaseConnected = false;

// Global jobs storage
let allJobs = [];
let currentJobsDisplayed = 0;
const JOBS_PER_PAGE = 6;
const ADS_FREQUENCY = 3; // Show ad after every 3 posts
const JOB_EXPIRY_DAYS = 20; // Jobs expire after 20 days

// Anonymous like storage (localStorage)
let likedJobs = new Set();
let lastVisitTime = null;

// Qatar company domains (for URL parsing)
const QATAR_COMPANIES = {
    'qatarairways.com': { name: 'Qatar Airways', category: 'Others' },
    'careers.qatarairways.com': { name: 'Qatar Airways', category: 'Others' },
    'qatarenergy.qa': { name: 'Qatar Energy', category: 'Engineer' },
    'qatargas.com': { name: 'Qatargas', category: 'Engineer' },
    'ooredoo.qa': { name: 'Ooredoo Qatar', category: 'IT' },
    'vodafone.qa': { name: 'Vodafone Qatar', category: 'IT' },
    'qfab.com.qa': { name: 'QFAB - Qatar Fabrication Company', category: 'Construction' },
    'hmc.gov.qa': { name: 'Hamad Medical Corporation', category: 'Healthcare' },
    'qu.edu.qa': { name: 'Qatar University', category: 'Others' },
    'qnb.com': { name: 'Qatar National Bank', category: 'Accountant' },
    'thepearlqatar.com': { name: 'The Pearl Qatar', category: 'Others' },
    'qatarcool.com': { name: 'Qatar Cool', category: 'Technician' },
    'mwani.com.qa': { name: 'Mwani Qatar', category: 'Others' },
    'qatarexhibition.com': { name: 'Qatar Exhibition Company', category: 'Others' }
};

// Category data
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
    { name: 'Helper', icon: '🛠️', count: 0, label: 'Helper' },
    { name: 'Others', icon: '💼', count: 0, label: 'Others' }
];

// Demo data
const demoJobs = [
    {
        id: 1,
        position: "Senior Software Engineer",
        company: "Tech Qatar Solutions",
        description: "Join our innovative team building next-generation solutions for Qatar's digital transformation.\n\n💰 Salary: QR 12,000/month\n📍 Location: West Bay, Doha\n\nRequirements:\n- 3+ years React, Node.js experience\n- Cloud technologies expertise\n\nBenefits: Health insurance, annual bonus, flexible hours",
        salary: "QR 12,000",
        category: "IT",
        location: "West Bay, Doha",
        hashtags: ["QatarJobs", "IT", "SoftwareEngineer", "React"],
        likes: 124,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        poster_url: null,
        job_url: null
    },
    {
        id: 2,
        position: "Sales Coordinator",
        company: "Qatar National Plastic Factory",
        description: "Looking for experienced sales coordinator to handle client relations.\n\n💰 Salary: QR 8,500/month\n📍 Location: Industrial Area, Doha\n\nResponsibilities:\n- Client meetings\n- Sales reports\n- Team coordination",
        salary: "QR 8,500",
        category: "Sales",
        location: "Doha",
        hashtags: ["QatarJobs", "Sales", "Hiring"],
        likes: 87,
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        poster_url: null,
        job_url: null
    }
];

// Initialize Supabase
function initializeSupabase() {
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
        isSupabaseConnected = false;
    }
}

// Load user preferences
function loadUserPreferences() {
    try {
        const stored = localStorage.getItem('halajobs_liked');
        if (stored) {
            likedJobs = new Set(JSON.parse(stored));
        }
        
        lastVisitTime = localStorage.getItem('halajobs_last_visit');
        localStorage.setItem('halajobs_last_visit', new Date().toISOString());
    } catch (error) {
        console.warn('Could not load user preferences:', error);
    }
}

// Save liked jobs
function saveLikedJobs() {
    try {
        localStorage.setItem('halajobs_liked', JSON.stringify([...likedJobs]));
    } catch (error) {
        console.warn('Could not save liked jobs:', error);
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    console.log('🇶🇦 HALAJOBS.QA Loading...');
    initializeSupabase();
    loadUserPreferences();
    setupEventListeners();
    loadJobs();
    animateStatsOnScroll();
    console.log('🚀 HALAJOBS.QA Loaded Successfully!');
});

// ============================================
// URL PARSING FUNCTIONS (NEW)
// ============================================

function parseJobUrl(url) {
    if (!url || !url.trim()) return null;
    
    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.replace('www.', '');
        const pathname = urlObj.pathname;
        
        // Get company info from domain
        const companyInfo = QATAR_COMPANIES[hostname] || extractCompanyFromDomain(hostname);
        
        // Extract job title from URL path
        const jobTitle = extractTitleFromPath(pathname);
        
        return {
            url: url,
            domain: hostname,
            company: companyInfo.name,
            category: companyInfo.category,
            title: jobTitle
        };
    } catch (error) {
        console.warn('Invalid URL:', error);
        return null;
    }
}

function extractCompanyFromDomain(domain) {
    // Remove common TLDs and format as company name
    const name = domain
        .replace(/\.(com|qa|net|org|co|gov).*$/, '')
        .split('.')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    
    return {
        name: name,
        category: 'Others'
    };
}

function extractTitleFromPath(pathname) {
    // Common patterns: /job/title-here, /careers/title, /jobs/123-title
    const segments = pathname.split('/').filter(s => s.length > 0);
    
    // Find the segment that looks like a job title
    for (let segment of segments) {
        // Skip common keywords
        if (['job', 'jobs', 'career', 'careers', 'vacancy', 'opening'].includes(segment.toLowerCase())) {
            continue;
        }
        
        // Check if it's a title-like segment (has hyphens, reasonable length)
        if (segment.includes('-') && segment.length > 10) {
            return segment
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ')
                .replace(/\d+/g, '')
                .trim();
        }
    }
    
    return 'Job Position (See Link)';
}

function generateUrlPreview(urlData) {
    if (!urlData) return '';
    
    return `
        <div class="job-link-preview" onclick="window.open('${escapeHtml(urlData.url)}', '_blank', 'noopener,noreferrer')">
            <div class="job-link-preview-content">
                <div class="job-link-preview-text">
                    <div class="job-link-preview-title">${escapeHtml(urlData.title)}</div>
                    <div class="job-link-preview-company">Job by ${escapeHtml(urlData.company)}</div>
                    <div class="job-link-preview-domain">${escapeHtml(urlData.domain)}</div>
                </div>
                <button class="view-job-btn" onclick="event.stopPropagation(); window.open('${escapeHtml(urlData.url)}', '_blank', 'noopener,noreferrer')">
                    View job →
                </button>
            </div>
        </div>
    `;
}

// ============================================
// JOB EXPIRATION & SMART SORTING (NEW)
// ============================================

function filterExpiredJobs(jobs) {
    const now = Date.now();
    const expiryThreshold = JOB_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    
    return jobs.filter(job => {
        const jobAge = now - new Date(job.created_at).getTime();
        return jobAge < expiryThreshold;
    }).map(job => {
        const jobAge = now - new Date(job.created_at).getTime();
        const daysRemaining = Math.ceil((expiryThreshold - jobAge) / (24 * 60 * 60 * 1000));
        
        return {
            ...job,
            daysRemaining: daysRemaining,
            isExpiringSoon: daysRemaining <= 3,
            isNew: lastVisitTime && new Date(job.created_at) > new Date(lastVisitTime)
        };
    });
}

function smartSortJobs(jobs) {
    const now = Date.now();
    
    return jobs.sort((a, b) => {
        // Calculate recency score (0-1000 points)
        const ageA = now - new Date(a.created_at).getTime();
        const ageB = now - new Date(b.created_at).getTime();
        const recencyA = Math.max(0, 1000 - (ageA / (24 * 60 * 60 * 1000)) * 50);
        const recencyB = Math.max(0, 1000 - (ageB / (24 * 60 * 60 * 1000)) * 50);
        
        // Calculate engagement score (0-500 points)
        const engagementA = (a.likes || 0) * 10;
        const engagementB = (b.likes || 0) * 10;
        
        // Add randomness (0-200 points) for variety
        const randomA = Math.random() * 200;
        const randomB = Math.random() * 200;
        
        const scoreA = recencyA + engagementA + randomA;
        const scoreB = recencyB + engagementB + randomB;
        
        return scoreB - scoreA;
    });
}

function generateJobBadges(job) {
    const badges = [];
    
    if (job.isNew) {
        badges.push('<span class="new-badge">🆕 NEW</span>');
    }
    
    if (job.isExpiringSoon) {
        badges.push(`<span class="expiring-badge">⏰ Expires in ${job.daysRemaining} day${job.daysRemaining !== 1 ? 's' : ''}</span>`);
    }
    
    return badges.length > 0 ? `<div class="job-badges">${badges.join('')}</div>` : '';
}

// ============================================
// LOAD JOBS WITH SMART FEATURES
// ============================================

async function loadJobs() {
    console.log('📊 Loading jobs with smart sorting...');
    const jobsList = document.getElementById('jobsList');
    if (jobsList) {
        jobsList.innerHTML = '<div class="loading"><div class="spinner"></div><span>Loading latest Qatar jobs...</span></div>';
    }

    let jobs = [];
    
    if (isSupabaseConnected && supabase) {
        try {
            const { data, error } = await supabase
                .from("jobs")
                .select("*")
                .order("created_at", { ascending: false });
            
            if (error) {
                console.error("Supabase fetch error:", error);
                jobs = [...demoJobs];
            } else {
                jobs = data || [];
                if (jobs.length === 0) {
                    jobs = [...demoJobs];
                }
            }
        } catch (error) {
            console.error("Error loading from database:", error);
            jobs = [...demoJobs];
        }
    } else {
        await new Promise(resolve => setTimeout(resolve, 1000));
        jobs = [...demoJobs];
    }

    // Ensure all jobs have required fields
    jobs = jobs.map(job => ({
        ...job,
        likes: job.likes || 0,
        hashtags: job.hashtags || extractHashtags(job.description || '')
    }));

    // Filter expired jobs (20+ days old)
    jobs = filterExpiredJobs(jobs);
    
    // Apply smart sorting
    jobs = smartSortJobs(jobs);

    allJobs = jobs;
    currentJobsDisplayed = Math.min(JOBS_PER_PAGE, jobs.length);
    
    renderJobsWithAds(jobs.slice(0, currentJobsDisplayed));
    updateQatarStats(jobs);
    updateQatarCategories(jobs);
    updateAdminStats();
    
    console.log(`✅ Loaded ${jobs.length} active jobs (expired jobs filtered)`);
}

// Extract hashtags from text
function extractHashtags(text) {
    if (!text) return [];
    const hashtagRegex = /#[\w\u0621-\u064A]+/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map(tag => tag.substring(1)) : [];
}

// ============================================
// RENDER JOBS WITH ADS
// ============================================

function renderJobsWithAds(jobs, append = false) {
    const jobsList = document.getElementById('jobsList');
    if (!jobsList) return;
    
    if (!jobs || jobs.length === 0) {
        if (!append) {
            jobsList.innerHTML = '<div style="text-align:center;padding:40px;color:#888;"><h3>No jobs found</h3><p>Try adjusting your search criteria!</p></div>';
        }
        return;
    }

    const container = append ? jobsList.querySelector('.jobs-container') : document.createElement('div');
    if (!append) {
        container.className = 'jobs-container';
        jobsList.innerHTML = '';
    }

    jobs.forEach((job, index) => {
        // Render job card
        const jobCard = createJobCard(job, index);
        container.appendChild(jobCard);

        // Insert ad after every ADS_FREQUENCY posts
        if ((index + 1) % ADS_FREQUENCY === 0 && (index + 1) < jobs.length) {
            const adContainer = createAdContainer();
            container.appendChild(adContainer);
        }
    });

    if (!append) {
        jobsList.appendChild(container);
    }
    
    addJobActionListeners();
}

// ============================================
// CREATE JOB CARD WITH URL PREVIEW
// ============================================

function createJobCard(job, index) {
    if (!job || !job.position || !job.company) {
        return document.createElement('div');
    }
    
    const div = document.createElement("div");
    div.className = "job-card fade-in";
    div.style.animationDelay = (index * 0.1) + 's';
    if (isAdminMode) {
        div.classList.add('admin-mode');
    }
    
    const jobTitle = escapeHtml(String(job.position || ''));
    const jobCompany = escapeHtml(String(job.company || ''));
    const jobLocation = escapeHtml(String(job.location || ''));
    const jobDescription = escapeHtml(String(job.description || '')).replace(/\n/g, '<br>');
    const jobSalary = escapeHtml(String(job.salary || ''));
    const jobId = parseInt(job.id) || Math.floor(Math.random() * 10000);
    const likes = parseInt(job.likes) || 0;
    const isLiked = likedJobs.has(jobId);
    
    const salaryHtml = job.salary ? `<div class="salary-badge">${jobSalary}</div>` : "";
    const locationHtml = job.location ? `<div class="job-location">📍 ${jobLocation}</div>` : "";
    const posterHtml = job.poster_url ? `<img src="${escapeHtml(job.poster_url)}" class="job-poster" alt="Job Poster" loading="lazy">` : "";
    
    // NEW: Generate URL preview if job_url exists
    const urlPreviewHtml = job.job_url ? generateUrlPreview(parseJobUrl(job.job_url)) : '';
    
    // NEW: Generate badges (NEW/EXPIRING)
    const badgesHtml = generateJobBadges(job);
    
    // Render hashtags
    const hashtags = job.hashtags || [];
    const hashtagsHtml = hashtags.length > 0 ? 
        `<div class="job-hashtags">
            ${hashtags.map(tag => `<span class="hashtag" data-hashtag="${escapeHtml(tag)}">#${escapeHtml(tag)}</span>`).join('')}
        </div>` : '';
    
    div.innerHTML = `
        <div class="job-id ${isAdminMode ? 'admin-visible' : ''}">ID: ${jobId}</div>
        ${badgesHtml}
        
        <div class="job-header">
            <div class="job-info">
                <h3 class="job-title">${jobTitle}</h3>
                <div class="job-company">${jobCompany}</div>
                ${locationHtml}
            </div>
            ${salaryHtml}
        </div>
        
        <div class="job-description">${jobDescription || 'No description provided.'}</div>
        
        ${hashtagsHtml}
        ${posterHtml}
        ${urlPreviewHtml}
        
        <div class="job-footer">
            <div class="job-date">📅 Posted ${formatDate(job.created_at)}</div>
            <div class="job-actions">
                <button class="like-btn ${isLiked ? 'liked' : ''}" 
                    data-job-id="${jobId}" 
                    data-likes="${likes}">
                    <span class="like-icon">${isLiked ? '❤️' : '🤍'}</span>
                    <span class="like-count">${likes}</span>
                </button>
                <button class="share-btn" 
                    data-job-title="${jobTitle}" 
                    data-job-company="${jobCompany}" 
                    data-job-description="${job.description || ''}" 
                    data-job-salary="${jobSalary}" 
                    data-job-location="${jobLocation}" 
                    data-job-hashtags="${hashtags.join(', ')}">
                    📤 Share
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
    
    return div;
}

// Create ad container
function createAdContainer() {
    const adDiv = document.createElement('div');
    adDiv.className = 'ad-slot-card fade-in';
    adDiv.innerHTML = `
        <ins class="adsbygoogle"
             style="display:block; width:100%; height:250px;"
             data-ad-client="ca-pub-1234130590681170"
             data-ad-slot="1234567890"
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>
    `;
    
    // Initialize Google Ad
    setTimeout(() => {
        try {
            (adsbygoogle = window.adsbygoogle || []).push({});
        } catch (error) {
            console.log('Ad loading skipped (AdBlocker or no connection)');
        }
    }, 100);
    
    return adDiv;
}

// ============================================
// URL PREVIEW IN COMPOSER (NEW)
// ============================================

function setupUrlPreview() {
    const jobUrlInput = document.getElementById('jobUrl');
    const urlPreviewContainer = document.getElementById('urlPreviewContainer');
    const urlPreviewLoading = document.getElementById('urlPreviewLoading');
    const urlPreviewContent = document.getElementById('urlPreviewContent');
    const removeUrlPreview = document.getElementById('removeUrlPreview');
    
    if (jobUrlInput) {
        jobUrlInput.addEventListener('input', debounce(function() {
            const url = jobUrlInput.value.trim();
            
            if (!url) {
                urlPreviewContainer.style.display = 'none';
                return;
            }
            
            // Show loading
            urlPreviewContainer.style.display = 'block';
            urlPreviewLoading.style.display = 'flex';
            urlPreviewContent.style.display = 'none';
            
            // Parse URL
            setTimeout(() => {
                const urlData = parseJobUrl(url);
                
                urlPreviewLoading.style.display = 'none';
                
                if (urlData) {
                    urlPreviewContent.innerHTML = `
                        <div class="url-preview-title">${escapeHtml(urlData.title)}</div>
                        <div class="url-preview-company">Job by ${escapeHtml(urlData.company)}</div>
                        <div class="url-preview-domain">${escapeHtml(urlData.domain)}</div>
                    `;
                    urlPreviewContent.style.display = 'block';
                } else {
                    urlPreviewContent.innerHTML = '<div class="url-preview-error">Invalid URL format</div>';
                    urlPreviewContent.style.display = 'block';
                }
            }, 500);
        }, 800));
    }
    
    if (removeUrlPreview) {
        removeUrlPreview.addEventListener('click', function() {
            if (jobUrlInput) jobUrlInput.value = '';
            if (urlPreviewContainer) urlPreviewContainer.style.display = 'none';
        });
    }
}

// ============================================
// JOB SUBMISSION WITH URL
// ============================================

async function handleJobSubmission() {
    console.log('🚀 Starting job submission...');
    
    const mainContent = document.getElementById('mainContent')?.value?.trim();
    const jobUrl = document.getElementById('jobUrl')?.value?.trim();
    
    console.log('Main content length:', mainContent?.length);
    console.log('Job URL:', jobUrl);
    
    if (!mainContent || mainContent.length < 20) {
        showNotification('Please write job details (minimum 20 characters)', 'error');
        console.log('❌ Validation failed: content too short');
        return;
    }
    
    // Parse the content
    const lines = mainContent.split('\n').filter(line => line.trim());
    
    // Extract title
    let position = lines[0] || 'Job Position';
    position = position.replace(/[🚀💼📋✨🎯]/g, '').trim();
    
    // Extract company
    let company = 'Company';
    const companyMatch = mainContent.match(/(?:at|@)\s+([^\n]+)/i);
    if (companyMatch) {
        company = companyMatch[1].split(/[#\n]/)[0].trim();
    } else if (lines.length > 1) {
        company = lines[1].replace(/[🚀💼📋✨🎯]/g, '').trim();
    }
    
    // If URL provided, use data from URL
    let urlData = null;
    if (jobUrl) {
        urlData = parseJobUrl(jobUrl);
        if (urlData) {
            // Override with URL data if title/company not clearly defined
            if (position === 'Job Position' || position.length < 5) {
                position = urlData.title;
            }
            if (company === 'Company' || company.length < 3) {
                company = urlData.company;
            }
        }
    }
    
    // Extract salary
    let salary = null;
    const salaryMatch = mainContent.match(/(?:salary|💰|qr)[\s:]*([^\n]+)/i);
    if (salaryMatch) {
        salary = salaryMatch[1].split(/[#\n]/)[0].trim();
    }
    
    // Extract location
    let location = null;
    const locationMatch = mainContent.match(/(?:location|📍)[\s:]*([^\n]+)/i);
    if (locationMatch) {
        location = locationMatch[1].split(/[#\n]/)[0].trim();
    }
    
    // Auto-detect category
    let category = urlData?.category || 'Others';
    const contentLower = mainContent.toLowerCase();
    
    if (!urlData) {
        if (contentLower.includes('software') || contentLower.includes('developer') || contentLower.includes(' it ')) {
            category = 'IT';
        } else if (contentLower.includes('engineer')) {
            category = 'Engineer';
        } else if (contentLower.includes('driver')) {
            category = 'Driver';
        } else if (contentLower.includes('sales')) {
            category = 'Sales';
        } else if (contentLower.includes('nurse') || contentLower.includes('medical')) {
            category = 'Healthcare';
        } else if (contentLower.includes('accountant')) {
            category = 'Accountant';
        } else if (contentLower.includes('delivery')) {
            category = 'Delivery';
        } else if (contentLower.includes('construction')) {
            category = 'Construction';
        } else if (contentLower.includes('technician')) {
            category = 'Technician';
        } else if (contentLower.includes('helper')) {
            category = 'Helper';
        }
    }
    
    // Extract hashtags
    const hashtags = extractHashtags(mainContent);
    
    // Handle image upload
    const posterUpload = document.getElementById('posterUpload');
    let posterUrl = null;
    if (posterUpload && posterUpload.files && posterUpload.files[0]) {
        const reader = new FileReader();
        posterUrl = await new Promise((resolve) => {
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(posterUpload.files[0]);
        });
    }
    
    const jobData = {
        position: position.substring(0, 200),
        company: company.substring(0, 200),
        description: mainContent,
        category,
        salary,
        location,
        hashtags,
        likes: 0,
        poster_url: posterUrl,
        job_url: jobUrl || null,
        created_at: new Date().toISOString()
    };
    
    const submitBtn = document.getElementById('submitJob');
    submitBtn.textContent = 'Posting...';
    submitBtn.disabled = true;
    
    try {
        let savedJob = null;
        
        if (isSupabaseConnected && supabase) {
            const { data, error } = await supabase
                .from('jobs')
                .insert([jobData])
                .select()
                .single();
            
            if (error) throw error;
            savedJob = data;
        } else {
            savedJob = { ...jobData, id: Date.now() };
        }
        
        allJobs.unshift(savedJob);
        currentJobsDisplayed = Math.min(currentJobsDisplayed + 1, allJobs.length);
        renderJobsWithAds(allJobs.slice(0, currentJobsDisplayed));
        updateQatarStats(allJobs);
        updateQatarCategories(allJobs);
        
        const jobModal = document.getElementById('jobModal');
        if (jobModal) jobModal.style.display = 'none';
        resetJobForm();
        
        showNotification('Job posted successfully! 🎉', 'success');
        
        const jobsList = document.getElementById('jobsList');
        if (jobsList) jobsList.scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        console.error('Error posting job:', error);
        showNotification('Failed to post job', 'error');
    } finally {
        submitBtn.textContent = 'Post Job';
        submitBtn.disabled = false;
    }
}

// ============================================
// EVENT LISTENERS & ACTIONS
// ============================================

function addJobActionListeners() {
    // Like buttons
    document.querySelectorAll('.like-btn').forEach(btn => {
        btn.removeEventListener('click', handleLikeClick);
        btn.addEventListener('click', handleLikeClick);
    });
    
    // Share buttons
    document.querySelectorAll('.share-btn').forEach(btn => {
        btn.removeEventListener('click', handleShareClick);
        btn.addEventListener('click', handleShareClick);
    });
    
    // Delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.removeEventListener('click', handleDeleteClick);
        btn.addEventListener('click', handleDeleteClick);
    });
    
    // Hashtag clicks
    document.querySelectorAll('.hashtag').forEach(tag => {
        tag.removeEventListener('click', handleHashtagClick);
        tag.addEventListener('click', handleHashtagClick);
    });
}

// Handle like button click
function handleLikeClick(event) {
    const btn = event.currentTarget;
    const jobId = parseInt(btn.getAttribute('data-job-id'));
    let likes = parseInt(btn.getAttribute('data-likes'));
    
    const isLiked = likedJobs.has(jobId);
    
    if (isLiked) {
        likedJobs.delete(jobId);
        likes = Math.max(0, likes - 1);
        btn.classList.remove('liked');
        btn.querySelector('.like-icon').textContent = '🤍';
    } else {
        likedJobs.add(jobId);
        likes += 1;
        btn.classList.add('liked');
        btn.querySelector('.like-icon').textContent = '❤️';
    }
    
    btn.setAttribute('data-likes', likes);
    btn.querySelector('.like-count').textContent = likes;
    saveLikedJobs();
    
    if (isSupabaseConnected && supabase) {
        updateJobLikes(jobId, likes);
    }
    
    const job = allJobs.find(j => j.id === jobId);
    if (job) job.likes = likes;
}

async function updateJobLikes(jobId, likes) {
    try {
        await supabase.from('jobs').update({ likes: likes }).eq('id', jobId);
    } catch (error) {
        console.warn('Could not update likes in database:', error);
    }
}

function handleHashtagClick(event) {
    const hashtag = event.currentTarget.getAttribute('data-hashtag');
    const searchInput = document.getElementById('jobSearch');
    if (searchInput) {
        searchInput.value = `#${hashtag}`;
        performSearch();
        
        const jobsList = document.getElementById('jobsList');
        if (jobsList) jobsList.scrollIntoView({ behavior: 'smooth' });
    }
}

function handleShareClick(event) {
    const btn = event.currentTarget;
    const jobTitle = btn.getAttribute('data-job-title');
    const jobCompany = btn.getAttribute('data-job-company');
    const jobDescription = btn.getAttribute('data-job-description');
    const jobSalary = btn.getAttribute('data-job-salary');
    const jobLocation = btn.getAttribute('data-job-location');
    const jobHashtags = btn.getAttribute('data-job-hashtags');
    
    shareJob(jobTitle, jobCompany, jobDescription, jobSalary, jobLocation, jobHashtags);
}

function handleDeleteClick(event) {
    const btn = event.currentTarget;
    const jobId = btn.getAttribute('data-job-id');
    const jobTitle = btn.getAttribute('data-job-title');
    const jobCompany = btn.getAttribute('data-job-company');
    
    initiateDelete(jobId, jobTitle, jobCompany);
}

// Share job
function shareJob(position, company, description, salary, location, hashtags) {
    let jobText = `🇶🇦 JOB OPPORTUNITY IN QATAR\n\n`;
    jobText += `📋 ${position}\n`;
    jobText += `🏢 ${company}\n\n`;
    
    if (description && description.trim()) {
        jobText += `${description}\n\n`;
    }
    
    if (salary && salary.trim()) jobText += `💰 ${salary}\n`;
    if (location && location.trim()) jobText += `📍 ${location}\n`;
    
    jobText += `\n🌟 Find more jobs at: https://halajobsqa.com/\n\n`;
    
    if (hashtags && hashtags.trim()) {
        jobText += hashtags.split(',').map(tag => `#${tag.trim()}`).join(' ');
    } else {
        jobText += `#QatarJobs #MadeInQatar`;
    }
    
    if (navigator.share) {
        navigator.share({
            title: `${position} at ${company}`,
            text: jobText,
            url: 'https://halajobsqa.com/'
        }).then(() => {
            showNotification('Job shared successfully! 📱', 'success');
        }).catch(err => {
            if (err.name !== 'AbortError') copyToClipboard(jobText);
        });
    } else {
        copyToClipboard(jobText);
    }
}

function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showNotification('Job details copied! 📋', 'success');
        }).catch(() => fallbackCopyText(text));
    } else {
        fallbackCopyText(text);
    }
}

function fallbackCopyText(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
        document.execCommand('copy');
        showNotification('Job details copied! 📋', 'success');
    } catch (err) {
        showNotification('Please copy manually', 'info');
    }
    
    document.body.removeChild(textArea);
}

// Load More Jobs
function loadMoreJobs() {
    const remainingJobs = allJobs.length - currentJobsDisplayed;
    if (remainingJobs <= 0) {
        showNotification('No more jobs to load', 'info');
        const loadMoreBtn = document.querySelector('.load-more-btn');
        if (loadMoreBtn) loadMoreBtn.style.display = 'none';
        return;
    }
    
    const nextBatch = allJobs.slice(currentJobsDisplayed, currentJobsDisplayed + JOBS_PER_PAGE);
    const container = document.querySelector('.jobs-container');
    
    if (container) {
        nextBatch.forEach((job, index) => {
            const jobCard = createJobCard(job, currentJobsDisplayed + index);
            container.appendChild(jobCard);
            
            if ((currentJobsDisplayed + index + 1) % ADS_FREQUENCY === 0) {
                const adContainer = createAdContainer();
                container.appendChild(adContainer);
            }
        });
    }
    
    currentJobsDisplayed += nextBatch.length;
    addJobActionListeners();
    
    if (currentJobsDisplayed >= allJobs.length) {
        const loadMoreBtn = document.querySelector('.load-more-btn');
        if (loadMoreBtn) {
            loadMoreBtn.textContent = 'All jobs loaded ✓';
            loadMoreBtn.disabled = true;
        }
    }
    
    showNotification(`Loaded ${nextBatch.length} more jobs`, 'success');
}

// ============================================
// MODAL & FORM MANAGEMENT
// ============================================

function openJobModal() {
    const modal = document.getElementById('jobModal');
    if (modal) modal.style.display = 'flex';
}

function resetJobForm() {
    const mainContent = document.getElementById('mainContent');
    if (mainContent) mainContent.value = '';
    
    const posterUpload = document.getElementById('posterUpload');
    if (posterUpload) posterUpload.value = '';
    
    const jobUrl = document.getElementById('jobUrl');
    if (jobUrl) jobUrl.value = '';
    
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    if (imagePreviewContainer) imagePreviewContainer.style.display = 'none';
    
    const urlPreviewContainer = document.getElementById('urlPreviewContainer');
    if (urlPreviewContainer) urlPreviewContainer.style.display = 'none';
}

function setupImagePreview() {
    const posterUpload = document.getElementById('posterUpload');
    const imagePreview = document.getElementById('imagePreview');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const removeImageBtn = document.getElementById('removeImage');
    
    if (posterUpload) {
        posterUpload.addEventListener('change', function(e) {
            if (e.target.files && e.target.files[0]) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    if (imagePreview) imagePreview.src = event.target.result;
                    if (imagePreviewContainer) imagePreviewContainer.style.display = 'block';
                };
                reader.readAsDataURL(e.target.files[0]);
            }
        });
    }
    
    if (removeImageBtn) {
        removeImageBtn.addEventListener('click', function() {
            if (posterUpload) posterUpload.value = '';
            if (imagePreview) imagePreview.src = '';
            if (imagePreviewContainer) imagePreviewContainer.style.display = 'none';
        });
    }
}

// ============================================
// SEARCH FUNCTIONALITY
// ============================================

function setupSearch() {
    const jobSearchInput = document.getElementById('jobSearch');
    const categorySelect = document.getElementById('categorySelect');
    const locationSelect = document.getElementById('locationSelect');
    
    if (jobSearchInput) {
        jobSearchInput.addEventListener('input', debounce(performSearch, 500));
    }
    if (categorySelect) {
        categorySelect.addEventListener('change', performSearch);
    }
    if (locationSelect) {
        locationSelect.addEventListener('change', performSearch);
    }
}

function performSearch(event) {
    if (event) event.preventDefault();
    
    const searchTerm = document.getElementById('jobSearch')?.value?.trim().toLowerCase() || '';
    const category = document.getElementById('categorySelect')?.value || '';
    const location = document.getElementById('locationSelect')?.value || '';
    
    let filteredJobs = allJobs.filter(job => {
        const matchesSearch = !searchTerm || 
            (job.position && job.position.toLowerCase().includes(searchTerm)) ||
            (job.company && job.company.toLowerCase().includes(searchTerm)) ||
            (job.description && job.description.toLowerCase().includes(searchTerm)) ||
            (job.hashtags && job.hashtags.some(tag => tag.toLowerCase().includes(searchTerm.replace('#', ''))));
            
        const matchesCategory = !category || job.category === category;
        const matchesLocation = !location || (job.location && job.location.toLowerCase().includes(location.toLowerCase()));
        
        return matchesSearch && matchesCategory && matchesLocation;
    });
    
    // Apply smart sorting to filtered results
    filteredJobs = smartSortJobs(filteredJobs);
    
    renderJobsWithAds(filteredJobs);
    updateQatarStats(filteredJobs);
    
    // Update page title dynamically
    updatePageTitle(searchTerm, location, category);
}

function updatePageTitle(searchTerm, location, category) {
    let title = "Jobs in Qatar 2025";
    
    if (searchTerm) {
        title = `${searchTerm} Jobs in Qatar`;
    } else if (category) {
        title = `${category} Jobs in Qatar`;
    } else if (location) {
        title = `Jobs in ${location}, Qatar`;
    }
    
    document.title = `${title} | HALAJOBS.QA`;
}

// ============================================
// EVENT LISTENER SETUP
// ============================================

function setupEventListeners() {
    console.log('🔧 Setting up event listeners...');
    
    const elements = {
        searchForm: document.getElementById('searchForm'),
        menuToggle: document.getElementById('menuToggle'),
        closeMobileMenu: document.getElementById('closeMobileMenu'),
        loadMoreBtn: document.getElementById('loadMoreJobsBtn'),
        postJobFab: document.getElementById('postJobFab'),
        closeJobModal: document.getElementById('closeJobModal'),
        submitJob: document.getElementById('submitJob')
    };

    console.log('Submit button found:', !!elements.submitJob);

    if (elements.searchForm) {
        elements.searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            performSearch();
        });
    }

    setupSearch();
    setupImagePreview();
    setupUrlPreview(); // NEW

    if (elements.menuToggle) elements.menuToggle.addEventListener('click', toggleMobileMenu);
    if (elements.closeMobileMenu) elements.closeMobileMenu.addEventListener('click', toggleMobileMenu);
    if (elements.loadMoreBtn) elements.loadMoreBtn.addEventListener('click', loadMoreJobs);
    if (elements.postJobFab) {
        elements.postJobFab.addEventListener('click', function() {
            console.log('📝 Opening job modal...');
            openJobModal();
        });
    }
    if (elements.closeJobModal) {
        elements.closeJobModal.addEventListener('click', function() {
            console.log('❌ Closing job modal...');
            const jobModal = document.getElementById('jobModal');
            if (jobModal) jobModal.style.display = 'none';
        });
    }
    if (elements.submitJob) {
        console.log('✅ Attaching submit handler to button');
        elements.submitJob.addEventListener('click', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🎯 Post Job button clicked!');
            await handleJobSubmission();
        });
    } else {
        console.error('❌ Submit button not found!');
    }

    // Also handle Enter key in textarea
    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
        mainContent.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                handleJobSubmission();
            }
        });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.shiftKey && e.key === 'M') {
            e.preventDefault();
            toggleAdminMode();
        }
        if (e.key === 'Escape') closeAllModals();
    });

    // Delete confirmation modal
    const confirmModal = document.getElementById('confirmModal');
    const confirmDelete = document.getElementById('confirmDelete');
    const cancelDelete = document.getElementById('cancelDelete');
    
    if (confirmModal) {
        confirmModal.addEventListener('click', function(e) {
            if (e.target === confirmModal) closeConfirmModal();
        });
    }
    if (confirmDelete) confirmDelete.addEventListener('click', handleConfirmDelete);
    if (cancelDelete) cancelDelete.addEventListener('click', closeConfirmModal);
}

function toggleMobileMenu() {
    const overlay = document.getElementById('mobileMenuOverlay');
    if (overlay) {
        const isActive = overlay.classList.contains('active');
        if (isActive) {
            overlay.classList.remove('active');
            document.body.style.overflow = 'auto';
        } else {
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }
}

function closeAllModals() {
    const jobModal = document.getElementById('jobModal');
    if (jobModal) jobModal.style.display = 'none';
    
    const confirmModal = document.getElementById('confirmModal');
    if (confirmModal) {
        confirmModal.style.display = 'none';
        confirmModal.classList.remove('active');
    }
    
    const overlay = document.getElementById('mobileMenuOverlay');
    if (overlay) overlay.classList.remove('active');
    
    document.body.style.overflow = 'auto';
    jobToDelete = null;
}

// ============================================
// STATS & CATEGORIES
// ============================================

function updateQatarStats(jobs) {
    const totalJobs = Math.max(jobs.length * 20, 1247);
    const uniqueCompanies = Math.max(new Set(jobs.map(job => job.company)).size * 10, 562);
    const estimatedSeekers = Math.max(totalJobs * 4, 8934);
    
    animateNumber('activeJobs', totalJobs);
    animateNumber('totalCompanies', uniqueCompanies);
    animateNumber('jobSeekers', estimatedSeekers);
}

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

function updateQatarCategories(jobs) {
    const categoryCounts = {};
    jobs.forEach(job => {
        const category = job.category || 'Others';
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
    
    qatarCategories.forEach(cat => {
        cat.count = (categoryCounts[cat.name] || 0) * 15 || Math.floor(Math.random() * 50) + 20;
    });
    
    renderQatarCategories();
}

function renderQatarCategories() {
    const container = document.getElementById('categoriesGrid');
    if (!container) return;
    
    container.innerHTML = '';
    
    const activeCategories = qatarCategories
        .filter(cat => cat.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);
    
    if (activeCategories.length === 0) {
        const defaultCategories = qatarCategories.slice(0, 6);
        defaultCategories.forEach(cat => {
            cat.count = Math.floor(Math.random() * 50) + 20;
        });
        activeCategories.push(...defaultCategories);
    }
    
    activeCategories.forEach(category => {
        const card = document.createElement('div');
        card.className = 'category-card';
        card.addEventListener('click', () => filterByCategory(category.name));
        
        card.innerHTML = `
            <span class="category-icon">${category.icon}</span>
            <div class="category-name">${category.label}</div>
            <div class="category-count">${category.count} job${category.count !== 1 ? 's' : ''}</div>
        `;
        
        container.appendChild(card);
    });
}

function filterByCategory(category) {
    const categorySelect = document.getElementById('categorySelect');
    if (categorySelect) {
        categorySelect.value = category;
        performSearch();
        const jobsList = document.getElementById('jobsList');
        if (jobsList) jobsList.scrollIntoView({ behavior: 'smooth' });
    }
}

function animateStatsOnScroll() {
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                setTimeout(() => updateQatarStats(allJobs), 300);
                observer.unobserve(entry.target);
            }
        });
    });

    const statsSection = document.querySelector('.stats-section');
    if (statsSection) observer.observe(statsSection);
}

// ============================================
// ADMIN FUNCTIONS
// ============================================

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
    const adminPanel = document.getElementById('adminPanel');
    if (adminPanel) adminPanel.classList.add('active');
    
    document.querySelectorAll('.delete-btn, .job-id').forEach(el => {
        el.classList.add('admin-visible');
    });
    
    document.querySelectorAll('.job-card').forEach(card => {
        card.classList.add('admin-mode');
    });

    updateAdminStats();
    showNotification('Admin mode activated', 'success');
}

function deactivateAdminMode() {
    isAdminMode = false;
    document.body.classList.remove('admin-mode');
    const adminPanel = document.getElementById('adminPanel');
    if (adminPanel) adminPanel.classList.remove('active');
    
    document.querySelectorAll('.delete-btn, .job-id').forEach(el => {
        el.classList.remove('admin-visible');
    });
    
    document.querySelectorAll('.job-card').forEach(card => {
        card.classList.remove('admin-mode');
    });
    
    showNotification('Admin mode deactivated', 'info');
}

function updateAdminStats() {
    if (isAdminMode) {
        const activeJobsCount = allJobs.length;
        const totalLikes = allJobs.reduce((sum, job) => sum + (job.likes || 0), 0);
        
        const totalJobsSpan = document.getElementById('totalJobs');
        const activeJobsCountSpan = document.getElementById('activeJobsCount');
        const totalLikesSpan = document.getElementById('totalLikes');
        const sessionDeletionsSpan = document.getElementById('sessionDeletions');
        
        if (totalJobsSpan) totalJobsSpan.textContent = activeJobsCount;
        if (activeJobsCountSpan) activeJobsCountSpan.textContent = activeJobsCount;
        if (totalLikesSpan) totalLikesSpan.textContent = totalLikes;
        if (sessionDeletionsSpan) sessionDeletionsSpan.textContent = sessionDeletions;
    }
}

function initiateDelete(jobId, position, company) {
    if (!isAdminMode) return;
    
    jobToDelete = {
        id: parseInt(jobId),
        position: position || 'Unknown Position',
        company: company || 'Unknown Company'
    };
    
    const confirmModal = document.getElementById('confirmModal');
    const jobDetails = document.getElementById('jobDetails');
    const deletePasscode = document.getElementById('deletePasscode');
    
    if (jobDetails) {
        jobDetails.innerHTML = `
            <p><strong>Position:</strong> ${escapeHtml(jobToDelete.position)}</p>
            <p><strong>Company:</strong> ${escapeHtml(jobToDelete.company)}</p>
            <p><strong>Job ID:</strong> ${jobToDelete.id}</p>
        `;
    }
    
    if (deletePasscode) deletePasscode.value = '';
    
    if (confirmModal) {
        confirmModal.style.display = 'flex';
        confirmModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeConfirmModal() {
    const confirmModal = document.getElementById('confirmModal');
    if (confirmModal) {
        confirmModal.style.display = 'none';
        confirmModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
    jobToDelete = null;
}

async function handleConfirmDelete() {
    const deletePasscode = document.getElementById('deletePasscode');
    
    if (!jobToDelete) {
        showNotification('No job selected for deletion', 'error');
        return;
    }
    
    if (!deletePasscode || deletePasscode.value !== ADMIN_PASSCODE) {
        showNotification('Incorrect passcode', 'error');
        return;
    }
    
    const jobIndex = allJobs.findIndex(job => job.id === jobToDelete.id);
    if (jobIndex !== -1) {
        allJobs.splice(jobIndex, 1);
        sessionDeletions++;
        
        showNotification(`Job "${jobToDelete.position}" deleted`, 'success');
        
        renderJobsWithAds(allJobs.slice(0, currentJobsDisplayed));
        updateAdminStats();
        updateQatarStats(allJobs);
        updateQatarCategories(allJobs);
        
        if (isSupabaseConnected && supabase) {
            try {
                await supabase.from('jobs').delete().eq('id', jobToDelete.id);
            } catch (error) {
                console.error('Database delete error:', error);
            }
        }
    } else {
        showNotification('Job not found', 'error');
    }
    
    closeConfirmModal();
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

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
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) {
            const weeks = Math.floor(diffDays / 7);
            return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
        }
        
        return date.toLocaleDateString('en-GB', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (error) {
        return 'Recently';
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = function() {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showNotification(message, type = 'success') {
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type} show`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Export functions for global access
window.shareJob = shareJob;
window.toggleMobileMenu = toggleMobileMenu;
window.initiateDelete = initiateDelete;
window.performSearch = performSearch;
window.loadMoreJobs = loadMoreJobs;
window.openJobModal = openJobModal;
window.handleJobSubmission = handleJobSubmission;
window.loadJobs = loadJobs;

console.log('✅ HALAJOBS.QA - Complete Script with URL Preview Loaded Successfully!');
