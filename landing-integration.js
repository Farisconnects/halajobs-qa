// landing-script.js - Qatar-themed Landing Page JavaScript

// Configuration - Use your existing Supabase credentials
const supabaseUrl = "https://ehoctsjvtfuesqeonlco.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVob2N0c2p2dGZ1ZXNxZW9ubGNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5OTU2ODcsImV4cCI6MjA3MjU3MTY4N30.kGz2t58YXWTwOB_h40dH0GOBLF12FQxKsZnqQ983Xro";

// Global variables
let supabase = null;
let isSupabaseConnected = false;
let currentApplication = null;

// Category data with icons
const categories = [
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

// Demo jobs for fallback
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
    },
    {
        id: 5,
        position: "Construction Site Manager",
        company: "Qatar Construction Co",
        description: "Oversee major construction projects in Qatar. Manage teams, ensure safety compliance, and deliver projects on time. Experience with Qatar construction standards required.",
        salary: "QR 15,000",
        category: "Construction",
        location: "Lusail",
        contact: "hr@qcc.qa",
        created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        poster_url: null,
        is_image_only: false
    },
    {
        id: 6,
        position: "Mechanical Engineer",
        company: "Qatar Engineering Solutions",
        description: "Design and maintain mechanical systems for industrial projects. Work with cutting-edge technology in Qatar's growing engineering sector.",
        salary: "QR 11,000",
        category: "Engineer",
        location: "Industrial Area, Doha",
        contact: "careers@qes.com.qa",
        created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        poster_url: null,
        is_image_only: false
    }
];

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    console.log('🇶🇦 HALAJOBS.QA Landing Page Loading...');
    initializeSupabase();
    loadJobsAndStats();
    setupEventListeners();
    handleUrlParameters();
    
    // Track page view
    if (typeof gtag !== 'undefined') {
        gtag('event', 'page_view', {
            page_title: 'Landing Page',
            page_location: window.location.href
        });
    }
});

// Initialize Supabase connection
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
        console.log("Using demo data instead");
        isSupabaseConnected = false;
    }
}

// Setup event listeners
function setupEventListeners() {
    // Close modals when clicking outside
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('application-modal') || e.target.classList.contains('mobile-menu-overlay')) {
            closeApplicationModal();
            toggleMobileMenu(false);
        }
    });

    // Close modals with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeApplicationModal();
            toggleMobileMenu(false);
        }
    });

    // Animate stats numbers on scroll
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                animateStats();
                observer.unobserve(entry.target);
            }
        });
    });

    const statsSection = document.querySelector('.stats-section');
    if (statsSection) {
        observer.observe(statsSection);
    }
}

// Handle URL parameters
function handleUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const search = urlParams.get('search');
    const location = urlParams.get('location');
    const category = urlParams.get('category');
    
    // Pre-fill search form if parameters exist
    if (search) {
        const searchInput = document.getElementById('jobSearch');
        if (searchInput) searchInput.value = search;
    }
    
    if (location) {
        const locationSelect = document.getElementById('locationSelect');
        if (locationSelect) locationSelect.value = location;
    }
    
    if (category) {
        const categorySelect = document.getElementById('categorySelect');
        if (categorySelect) categorySelect.value = category;
    }
}

// Load jobs and update stats
async function loadJobsAndStats() {
    let jobs = [];
    
    if (isSupabaseConnected) {
        try {
            console.log("Fetching jobs from Supabase...");
            const result = await supabase
                .from("jobs")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(6);

            if (result.error) {
                console.error("Supabase fetch error:", result.error);
                jobs = demoJobs.slice(0, 6);
            } else {
                console.log("Supabase jobs fetched:", result.data ? result.data.length : 0);
                jobs = result.data || [];
                
                if (jobs.length === 0) {
                    console.log("No jobs in database, using demo data");
                    jobs = demoJobs.slice(0, 6);
                }
            }
        } catch (error) {
            console.error("Database connection error:", error);
            jobs = demoJobs.slice(0, 6);
        }
    } else {
        // Simulate loading delay for demo
        await new Promise(resolve => setTimeout(resolve, 1000));
        jobs = demoJobs.slice(0, 6);
        console.log("Demo mode: Loaded", jobs.length, "jobs");
    }

    renderJobs(jobs);
    updateStats(jobs);
    updateCategories(jobs);
}

// Render jobs on the page
function renderJobs(jobs) {
    const container = document.getElementById('jobsList');
    
    if (!jobs || jobs.length === 0) {
        container.innerHTML = '<div class="loading"><div class="spinner"></div><span>No jobs available at the moment</span></div>';
        return;
    }

    const jobsContainer = document.createElement('div');
    jobsContainer.className = 'jobs-container';

    jobs.forEach(function(job, index) {
        const div = document.createElement("div");
        div.className = "job-card fade-in";
        div.style.animationDelay = (index * 0.1) + 's';
        
        const salaryHtml = job.salary ? `<div class="salary-badge">${escapeHtml(job.salary)}</div>` : '';
        const locationHtml = job.location ? `<div class="job-location">📍 ${escapeHtml(job.location)}</div>` : '';
        const tags = generateJobTags(job);
        
        div.innerHTML = `
            <div class="job-header">
                <div class="job-info">
                    <h3 class="job-title">${escapeHtml(job.position)}</h3>
                    <div class="job-company">${escapeHtml(job.company)}</div>
                    ${locationHtml}
                </div>
                ${salaryHtml}
            </div>
            <p class="job-description">${escapeHtml(job.description)}</p>
            <div class="job-tags">${tags}</div>
            <div class="job-footer">
                <div class="job-date">${formatDate(job.created_at)}</div>
                <div class="job-actions">
                    <button class="apply-btn" onclick="openApplicationModal(${job.id}, '${escapeHtml(job.position)}', '${escapeHtml(job.company)}', '${escapeHtml(job.location || '')}')">Apply Now</button>
                    <button class="share-btn" onclick="shareJob('${escapeHtml(job.position)}', '${escapeHtml(job.company)}', '${escapeHtml(job.description)}')">Share</button>
                </div>
            </div>
        `;
        
        jobsContainer.appendChild(div);
    });

    container.innerHTML = '';
    container.appendChild(jobsContainer);
}

// Generate job tags based on category and other factors
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

// Update stats display
function updateStats(jobs) {
    const totalJobs = jobs.length * 15; // Simulate larger database
    const totalCompanies = new Set(jobs.map(job => job.company)).size * 8;
    const jobSeekers = totalJobs * 7;

    // Store for animation
    window.statsData = {
        activeJobs: totalJobs,
        totalCompanies: totalCompanies,
        jobSeekers: jobSeekers
    };
}

// Animate stats numbers
function animateStats() {
    if (!window.statsData) return;

    const duration = 2000;
    const steps = 60;
    const stepDuration = duration / steps;

    Object.keys(window.statsData).forEach(function(key) {
        const element = document.getElementById(key);
        if (!element) return;
        
        const target = window.statsData[key];
        let current = 0;
        const increment = target / steps;

        const timer = setInterval(function() {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current).toLocaleString();
        }, stepDuration);
    });
}

// Update categories with job counts
function updateCategories(jobs) {
    const categoryCounts = {};
    
    // Count jobs by category
    jobs.forEach(function(job) {
        const category = job.category || 'Others';
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    // Update category objects
    categories.forEach(function(cat) {
        cat.count = (categoryCounts[cat.name] || 0) * 15; // Simulate larger numbers
    });

    // Sort by count and render
    const sortedCategories = categories
        .filter(cat => cat.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

    renderCategories(sortedCategories);
}

// Render categories
function renderCategories(cats) {
    const container = document.getElementById('categoriesGrid');
    container.innerHTML = '';

    cats.forEach(function(category) {
        const div = document.createElement("div");
        div.className = "category-card";
        div.onclick = function() { searchByCategory(category.name); };
        
        div.innerHTML = `
            <span class="category-icon">${category.icon}</span>
            <div class="category-name">${category.label}</div>
            <div class="category-count">${category.count} jobs</div>
        `;
        
        container.appendChild(div);
    });
}

// Mobile menu toggle
function toggleMobileMenu(force) {
    const overlay = document.getElementById('mobileMenuOverlay');
    const isActive = overlay.classList.contains('active');
    
    if (force !== undefined) {
        if (force) {
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            overlay.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    } else {
        if (isActive) {
            overlay.classList.remove('active');
            document.body.style.overflow = 'auto';
        } else {
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }
}

// Search functionality
function performSearch(event) {
    event.preventDefault();
    
    const jobSearch = document.getElementById('jobSearch').value.trim();
    const locationSelect = document.getElementById('locationSelect').value;
    const categorySelect = document.getElementById('categorySelect').value;
    
    // Build search parameters
    const searchParams = new URLSearchParams();
    if (jobSearch) searchParams.set('search', jobSearch);
    if (locationSelect) searchParams.set('location', locationSelect);
    if (categorySelect) searchParams.set('category', categorySelect);
    
    // Track search event
    if (typeof gtag !== 'undefined') {
        gtag('event', 'search', {
            search_term: jobSearch,
            location: locationSelect,
            category: categorySelect
        });
    }
    
    // Redirect to main jobs page with search parameters
    const targetUrl = `index.html${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    window.location.href = targetUrl;
}

// Category search
function searchByCategory(category) {
    // Track category click
    if (typeof gtag !== 'undefined') {
        gtag('event', 'category_click', {
            category: category
        });
    }
    
    window.location.href = `index.html?category=${encodeURIComponent(category)}`;
}

// Open application modal
function openApplicationModal(jobId, jobTitle, company, location) {
    currentApplication = { jobId, jobTitle, company, location };
    
    const modal = document.getElementById('applicationModal');
    const jobDetails = document.getElementById('applicationJobDetails');
    const proceedBtn = document.getElementById('proceedToApply');
    
    // Populate job details
    jobDetails.innerHTML = `
        <h3>${escapeHtml(jobTitle)}</h3>
        <div class="company">${escapeHtml(company)}</div>
        ${location ? `<div class="location">📍 ${escapeHtml(location)}</div>` : ''}
    `;
    
    // Set up proceed button
    proceedBtn.onclick = function() {
        proceedToApplication();
    };
    
    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Track application start
    if (typeof gtag !== 'undefined') {
        gtag('event', 'apply_start', {
            job_title: jobTitle,
            company: company
        });
    }
}

// Close application modal
function closeApplicationModal() {
    const modal = document.getElementById('applicationModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
    currentApplication = null;
}

// Proceed to full application
function proceedToApplication() {
    if (!currentApplication) return;
    
    const { jobId, jobTitle, company } = currentApplication;
    
    // Track application proceed
    if (typeof gtag !== 'undefined') {
        gtag('event', 'apply_proceed', {
            job_id: jobId,
            job_title: jobTitle,
            company: company
        });
    }
    
    // Close modal and redirect to main jobs page with application anchor
    closeApplicationModal();
    
    // Create application URL with job details
    const applicationUrl = `index.html#job-${jobId}`;
    window.location.href = applicationUrl;
}

// Share job functionality
function shareJob(position, company, description) {
    const shareText = `🔹 ${position} at ${company}\n\n📋 ${description.substring(0, 100)}${description.length > 100 ? '...' : ''}\n\n🌐 Find more jobs at: https://halajobsqa.com/`;
    
    if (navigator.share) {
        navigator.share({
            title: `${position} - ${company}`,
            text: shareText,
            url: window.location.origin
        }).then(() => {
            showNotification('Job shared successfully! 📱', 'success');
            
            // Track share
            if (typeof gtag !== 'undefined') {
                gtag('event', 'share', {
                    method: 'native',
                    content_type: 'job',
                    job_title: position
                });
            }
        }).catch(err => {
            console.log('Share cancelled or failed');
        });
    } else if (navigator.clipboard) {
        navigator.clipboard.writeText(shareText).then(() => {
            showNotification('Job details copied to clipboard! 📋', 'success');
            
            // Track share
            if (typeof gtag !== 'undefined') {
                gtag('event', 'share', {
                    method: 'clipboard',
                    content_type: 'job',
                    job_title: position
                });
            }
        }).catch(() => {
            fallbackCopyText(shareText);
        });
    } else {
        fallbackCopyText(shareText);
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

// Export functions for global access
window.toggleMobileMenu = toggleMobileMenu;
window.performSearch = performSearch;
window.searchByCategory = searchByCategory;
window.openApplicationModal = openApplicationModal;
window.closeApplicationModal = closeApplicationModal;
window.shareJob = shareJob;

console.log('🚀 HALAJOBS.QA Landing Page Integration Loaded Successfully!');
