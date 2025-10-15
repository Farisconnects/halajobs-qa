// HALAJOBS.QA - LinkedIn-Style Social Platform Script
console.log('🇶🇦 HALAJOBS.QA - Loading LinkedIn-Style Version...');

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
const ADS_FREQUENCY = 2; // Show ad after every 2 posts

// Anonymous like storage (localStorage)
let likedJobs = new Set();

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
        poster_url: null
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
        poster_url: null
    },
    {
        id: 3,
        position: "Registered Nurse",
        company: "Hamad Medical Corporation",
        description: "Seeking qualified nurses for expanding healthcare facilities.\n\n💰 Salary: QR 9,200/month\n📍 Location: Medical City, Doha\n\nRequirements:\n- Valid nursing license\n- 2+ years experience\n\nBenefits package included!",
        salary: "QR 9,200",
        category: "Healthcare",
        location: "Medical City, Doha",
        hashtags: ["QatarJobs", "Healthcare", "Nursing", "HMC"],
        likes: 156,
        created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        poster_url: null
    },
    {
        id: 4,
        position: "Delivery Driver",
        company: "Qatar Express",
        description: "Flexible working hours with competitive pay and tips!\n\n💰 Salary: QR 3,500+ (plus tips)\n📍 Location: Al Rayyan\n\nMust have valid Qatar driving license.\nJoin Qatar's largest delivery network!",
        salary: "QR 3,500+",
        category: "Delivery",
        location: "Al Rayyan",
        hashtags: ["QatarJobs", "Driver", "Delivery"],
        likes: 93,
        created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        poster_url: null
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

// Load liked jobs from localStorage
function loadLikedJobs() {
    try {
        const stored = localStorage.getItem('halajobs_liked');
        if (stored) {
            likedJobs = new Set(JSON.parse(stored));
        }
    } catch (error) {
        console.warn('Could not load liked jobs:', error);
        likedJobs = new Set();
    }
}

// Save liked jobs to localStorage
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
    loadLikedJobs();
    setupEventListeners();
    loadJobs();
    animateStatsOnScroll();
    console.log('🚀 HALAJOBS.QA Loaded Successfully!');
});

// Load jobs from database
async function loadJobs() {
    console.log('📊 Loading jobs...');
    const jobsList = document.getElementById('jobsList');
    if (jobsList) {
        jobsList.innerHTML = '<div class="loading"><div class="spinner"></div><span>Loading Qatar jobs...</span></div>';
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

    // Ensure all jobs have likes and hashtags
    jobs = jobs.map(job => ({
        ...job,
        likes: job.likes || 0,
        hashtags: job.hashtags || extractHashtags(job.description || '')
    }));

    allJobs = jobs;
    currentJobsDisplayed = Math.min(JOBS_PER_PAGE, jobs.length);
    
    renderJobsWithAds(jobs.slice(0, currentJobsDisplayed));
    updateQatarStats(jobs);
    updateQatarCategories(jobs);
    updateAdminStats();
}

// Extract hashtags from text
function extractHashtags(text) {
    if (!text) return [];
    const hashtagRegex = /#[\w\u0621-\u064A]+/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map(tag => tag.substring(1)) : [];
}

// Render jobs with ads inserted
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

// Create job card element - LinkedIn style
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
    
    // Render hashtags
    const hashtags = job.hashtags || [];
    const hashtagsHtml = hashtags.length > 0 ? 
        `<div class="job-hashtags">
            ${hashtags.map(tag => `<span class="hashtag" data-hashtag="${escapeHtml(tag)}">#${escapeHtml(tag)}</span>`).join('')}
        </div>` : '';
    
    div.innerHTML = `
        <div class="job-id ${isAdminMode ? 'admin-visible' : ''}">ID: ${jobId}</div>
        
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
    adDiv.className = 'ad-container fade-in';
    adDiv.innerHTML = `
        <div class="ad-label">Sponsored</div>
        <ins class="adsbygoogle"
             style="display:block"
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
            console.log('Ad loading skipped');
        }
    }, 100);
    
    return adDiv;
}

// Add event listeners for job actions
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

// Handle like button click - Anonymous
function handleLikeClick(event) {
    const btn = event.currentTarget;
    const jobId = parseInt(btn.getAttribute('data-job-id'));
    let likes = parseInt(btn.getAttribute('data-likes'));
    
    const isLiked = likedJobs.has(jobId);
    
    if (isLiked) {
        // Unlike
        likedJobs.delete(jobId);
        likes = Math.max(0, likes - 1);
        btn.classList.remove('liked');
        btn.querySelector('.like-icon').textContent = '🤍';
    } else {
        // Like
        likedJobs.add(jobId);
        likes += 1;
        btn.classList.add('liked');
        btn.querySelector('.like-icon').textContent = '❤️';
    }
    
    // Update UI
    btn.setAttribute('data-likes', likes);
    btn.querySelector('.like-count').textContent = likes;
    
    // Save to localStorage
    saveLikedJobs();
    
    // Update in database if connected
    if (isSupabaseConnected && supabase) {
        updateJobLikes(jobId, likes);
    }
    
    // Update in allJobs array
    const job = allJobs.find(j => j.id === jobId);
    if (job) {
        job.likes = likes;
    }
}

// Update job likes in database
async function updateJobLikes(jobId, likes) {
    try {
        await supabase
            .from('jobs')
            .update({ likes: likes })
            .eq('id', jobId);
    } catch (error) {
        console.warn('Could not update likes in database:', error);
    }
}

// Handle hashtag click
function handleHashtagClick(event) {
    const hashtag = event.currentTarget.getAttribute('data-hashtag');
    const searchInput = document.getElementById('jobSearch');
    if (searchInput) {
        searchInput.value = `#${hashtag}`;
        performSearch();
        
        // Scroll to jobs
        const jobsList = document.getElementById('jobsList');
        if (jobsList) {
            jobsList.scrollIntoView({ behavior: 'smooth' });
        }
    }
}

// Handle share button click
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

// Handle delete button click
function handleDeleteClick(event) {
    const btn = event.currentTarget;
    const jobId = btn.getAttribute('data-job-id');
    const jobTitle = btn.getAttribute('data-job-title');
    const jobCompany = btn.getAttribute('data-job-company');
    
    initiateDelete(jobId, jobTitle, jobCompany);
}

// Share job with hashtags
function shareJob(position, company, description, salary, location, hashtags) {
    let jobText = `🇶🇦 JOB OPPORTUNITY IN QATAR\n\n`;
    jobText += `📋 ${position}\n`;
    jobText += `🏢 ${company}\n\n`;
    
    if (description && description.trim()) {
        jobText += `${description}\n\n`;
    }
    
    if (salary && salary.trim()) {
        jobText += `💰 ${salary}\n`;
    }
    if (location && location.trim()) {
        jobText += `📍 ${location}\n`;
    }
    
    jobText += `\n🌟 Find more jobs at: https://halajobsqa.com/\n\n`;
    
    if (hashtags && hashtags.trim()) {
        jobText += hashtags.split(',').map(tag => `#${tag.trim()}`).join(' ');
    } else {
        jobText += `#QatarJobs #MadeInQatar #${company.replace(/\s+/g, '')}`;
    }
    
    if (navigator.share) {
        navigator.share({
            title: `${position} at ${company}`,
            text: jobText,
            url: 'https://halajobsqa.com/'
        }).then(() => {
            showNotification('Job shared successfully! 📱', 'success');
        }).catch(err => {
            if (err.name !== 'AbortError') {
                copyToClipboard(jobText);
            }
        });
    } else {
        copyToClipboard(jobText);
    }
}

// Copy to clipboard
function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showNotification('Job details copied! 📋', 'success');
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
    
    // Append to existing container
    const container = document.querySelector('.jobs-container');
    if (container) {
        nextBatch.forEach((job, index) => {
            const jobCard = createJobCard(job, currentJobsDisplayed + index);
            container.appendChild(jobCard);
            
            // Insert ad if needed
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
            loadMoreBtn.textContent = 'All jobs loaded  ✓';
            loadMoreBtn.disabled = true;
        }
    }
    
    showNotification(`Loaded ${nextBatch.length} more jobs`, 'success');
}

// Job submission - Simplified
async function handleJobSubmission() {
    const position = document.getElementById('position')?.value?.trim();
    const company = document.getElementById('company')?.value?.trim();
    const description = document.getElementById('description')?.value?.trim();
    const category = document.getElementById('category')?.value;
    
    if (!position || !company || !description || !category) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    const salary = document.getElementById('salary')?.value?.trim() || null;
    const location = document.getElementById('location')?.value?.trim() || null;
    const hashtagsInput = document.getElementById('hashtags')?.value?.trim() || '';
    const posterUpload = document.getElementById('posterUpload');
    
    // Extract hashtags
    let hashtags = [];
    if (hashtagsInput) {
        hashtags = hashtagsInput.split(/\s+/).map(tag => {
            tag = tag.trim();
            return tag.startsWith('#') ? tag.substring(1) : tag;
        }).filter(tag => tag.length > 0);
    }
    
    // Also extract hashtags from description
    const descHashtags = extractHashtags(description);
    hashtags = [...new Set([...hashtags, ...descHashtags])];
    
    let posterUrl = null;
    if (posterUpload && posterUpload.files && posterUpload.files[0]) {
        const reader = new FileReader();
        posterUrl = await new Promise((resolve) => {
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(posterUpload.files[0]);
        });
    }
    
    const jobData = {
        position,
        company,
        description,
        category,
        salary,
        location,
        hashtags,
        likes: 0,
        poster_url: posterUrl,
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

// Open/close modals
function openJobModal() {
    const modal = document.getElementById('jobModal');
    if (modal) modal.style.display = 'flex';
}

function resetJobForm() {
    const inputs = ['position', 'company', 'description', 'salary', 'location', 'category', 'hashtags'];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    
    const posterUpload = document.getElementById('posterUpload');
    if (posterUpload) posterUpload.value = '';
    
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    if (imagePreviewContainer) imagePreviewContainer.style.display = 'none';
}

// Setup image preview
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
                    if (imagePreview) {
                        imagePreview.src = event.target.result;
                    }
                    if (imagePreviewContainer) {
                        imagePreviewContainer.style.display = 'block';
                    }
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

// Search functionality
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
    
    const filteredJobs = allJobs.filter(job => {
        const matchesSearch = !searchTerm || 
            (job.position && job.position.toLowerCase().includes(searchTerm)) ||
            (job.company && job.company.toLowerCase().includes(searchTerm)) ||
            (job.description && job.description.toLowerCase().includes(searchTerm)) ||
            (job.hashtags && job.hashtags.some(tag => tag.toLowerCase().includes(searchTerm.replace('#', ''))));
            
        const matchesCategory = !category || job.category === category;
        const matchesLocation = !location || (job.location && job.location.toLowerCase().includes(location.toLowerCase()));
        
        return matchesSearch && matchesCategory && matchesLocation;
    });
    
    renderJobsWithAds(filteredJobs);
    updateQatarStats(filteredJobs);
}

// Event listener setup
function setupEventListeners() {
    const elements = {
        searchForm: document.getElementById('searchForm'),
        menuToggle: document.getElementById('menuToggle'),
        closeMobileMenu: document.getElementById('closeMobileMenu'),
        loadMoreBtn: document.getElementById('loadMoreJobsBtn'),
        postJobFab: document.getElementById('postJobFab'),
        closeJobModal: document.getElementById('closeJobModal'),
        submitJob: document.getElementById('submitJob')
    };

    if (elements.searchForm) {
        elements.searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            performSearch();
        });
    }

    setupSearch();
    setupImagePreview();

    if (elements.menuToggle) {
        elements.menuToggle.addEventListener('click', toggleMobileMenu);
    }
    if (elements.closeMobileMenu) {
        elements.closeMobileMenu.addEventListener('click', toggleMobileMenu);
    }
    if (elements.loadMoreBtn) {
        elements.loadMoreBtn.addEventListener('click', loadMoreJobs);
    }
    if (elements.postJobFab) {
        elements.postJobFab.addEventListener('click', openJobModal);
    }
    if (elements.closeJobModal) {
        elements.closeJobModal.addEventListener('click', function() {
            const jobModal = document.getElementById('jobModal');
            if (jobModal) jobModal.style.display = 'none';
        });
    }
    if (elements.submitJob) {
        elements.submitJob.addEventListener('click', function(e) {
            e.preventDefault();
            handleJobSubmission();
        });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.shiftKey && e.key === 'M') {
            e.preventDefault();
            toggleAdminMode();
        }
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });

    // Delete confirmation modal
    const confirmModal = document.getElementById('confirmModal');
    const confirmDelete = document.getElementById('confirmDelete');
    const cancelDelete = document.getElementById('cancelDelete');
    
    if (confirmModal) {
        confirmModal.addEventListener('click', function(e) {
            if (e.target === confirmModal) {
                closeConfirmModal();
            }
        });
    }
    if (confirmDelete) {
        confirmDelete.addEventListener('click', handleConfirmDelete);
    }
    if (cancelDelete) {
        cancelDelete.addEventListener('click', closeConfirmModal);
    }
}

// Mobile menu
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

// Stats and categories
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
        if (jobsList) {
            jobsList.scrollIntoView({ behavior: 'smooth' });
        }
    }
}

function animateStatsOnScroll() {
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    updateQatarStats(allJobs);
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

// Admin functions
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
        const totalJobs = allJobs.length;
        const totalLikes = allJobs.reduce((sum, job) => sum + (job.likes || 0), 0);
        
        const totalJobsSpan = document.getElementById('totalJobs');
        const totalLikesSpan = document.getElementById('totalLikes');
        const sessionDeletionsSpan = document.getElementById('sessionDeletions');
        
        if (totalJobsSpan) totalJobsSpan.textContent = totalJobs;
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
    
    if (deletePasscode) {
        deletePasscode.value = '';
    }
    
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

// Utility functions
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
        
        if (diffDays === 0) {
            return 'Today';
        } else if (diffDays === 1) {
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

// Export functions for global access
window.shareJob = shareJob;
window.toggleMobileMenu = toggleMobileMenu;
window.initiateDelete = initiateDelete;
window.performSearch = performSearch;
window.loadMoreJobs = loadMoreJobs;
window.openJobModal = openJobModal;
window.handleJobSubmission = handleJobSubmission;
window.loadJobs = loadJobs;

console.log('✅ HALAJOBS.QA - LinkedIn-Style Script Loaded Successfully!');
