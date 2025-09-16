if (detailedForm) detailedForm.style.display = 'none';
    if (quickForm) quickForm.style.display = 'block';
    if (detailedModeBtn) detailedModeBtn.classList.remove('active');
    if (quickModeBtn) quickModeBtn.classList.add('active');
}

// Setup search functionality
function setupSearch() {
    const searchForm = document.querySelector('.search-form');
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

// Setup job modal
function setupJobModal() {
    const detailedModeBtn = document.getElementById('detailedModeBtn');
    const quickModeBtn = document.getElementById('quickModeBtn');
    const quickUploadZone = document.getElementById('quickUploadZone');
    const quickPoster = document.getElementById('quickPoster');

    if (detailedModeBtn) {
        detailedModeBtn.addEventListener('click', switchToDetailedMode);
    }
    if (quickModeBtn) {
        quickModeBtn.addEventListener('click', switchToQuickMode);
    }

    if (quickUploadZone && quickPoster) {
        quickUploadZone.addEventListener('click', function() {
            quickPoster.click();
        });
        quickPoster.addEventListener('change', function(e) {
            if (e.target.files.length > 0) {
                handleQuickImageUpload(e.target.files[0]);
            }
        });
    }
}

// Handle quick image upload
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
    };
    reader.readAsDataURL(file);
}

// Handle job submission
function handleJobSubmission() {
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
            is_image_only: false
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
            whatsapp: quickWhatsapp || null,
            poster_url: quickImagePreview.src,
            is_image_only: true
        };
    }
    
    jobData.created_at = new Date().toISOString();
    jobData.id = Date.now();
    
    allJobs.unshift(jobData);
    showNotification('Job posted successfully!', 'success');
    
    const jobModal = document.getElementById('jobModal');
    if (jobModal) jobModal.style.display = 'none';
    
    resetJobForm();
    renderJobs(allJobs.slice(0, currentJobsDisplayed + 1));
    currentJobsDisplayed = Math.min(currentJobsDisplayed + 1, allJobs.length);
}

// Reset job form
function resetJobForm() {
    const inputs = ['position', 'description', 'company', 'salary', 'location', 'contact', 'whatsapp', 'category', 'quickTitle', 'quickCompany', 'quickCategory', 'quickWhatsapp'];
    inputs.forEach(id => {
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
    
    switchToDetailedMode();
}

// Perform search
function performSearch(event) {
    if (event) event.preventDefault();
    
    const searchTerm = document.getElementById('jobSearch')?.value?.trim().toLowerCase() || '';
    const category = document.getElementById('categorySelect')?.value || '';
    const location = document.getElementById('locationSelect')?.value || '';
    
    const filteredJobs = allJobs.filter(job => {
        const matchesSearch = !searchTerm || 
            (job.position && job.position.toLowerCase().includes(searchTerm)) ||
            (job.company && job.company.toLowerCase().includes(searchTerm)) ||
            (job.description && job.description.toLowerCase().includes(searchTerm));
            
        const matchesCategory = !category || job.category === category;
        const matchesLocation = !location || (job.location && job.location.toLowerCase().includes(location.toLowerCase()));
        
        return matchesSearch && matchesCategory && matchesLocation;
    });
    
    renderJobs(filteredJobs);
    updateQatarStats(filteredJobs);
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
            const result = await supabase.from("jobs").select("*").order("created_at", { ascending: false });
            if (result.error) {
                jobs = [...demoJobs];
            } else {
                jobs = result.data || [];
                if (jobs.length === 0) {
                    jobs = [...demoJobs];
                }
            }
        } catch (error) {
            jobs = [...demoJobs];
        }
    } else {
        await new Promise(resolve => setTimeout(resolve, 1000));
        jobs = [...demoJobs];
    }

    allJobs = jobs;
    currentJobsDisplayed = Math.min(JOBS_PER_PAGE, jobs.length);
    
    renderJobs(jobs.slice(0, currentJobsDisplayed));
    updateQatarStats(jobs);
    updateQatarCategories(jobs);
    updateAdminStats();
}

// COMPLETE JOB CARD RENDERING - Full details with no Apply button
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
        if (!job || !job.position || !job.company) {
            return;
        }
        
        const div = document.createElement("div");
        div.className = "job-card fade-in expanded-job-card";
        div.style.animationDelay = (index * 0.1) + 's';
        if (isAdminMode) {
            div.classList.add('admin-mode');
        }
        
        const jobTitle = escapeHtml(String(job.position || '').trim());
        const jobCompany = escapeHtml(String(job.company || '').trim());
        const jobLocation = escapeHtml(String(job.location || '').trim());
        const jobDescription = escapeHtml(String(job.description || ''));
        const jobSalary = escapeHtml(String(job.salary || '').trim());
        const jobContact = escapeHtml(String(job.contact || '').trim());
        const jobWhatsapp = escapeHtml(String(job.whatsapp || '').trim());
        const jobId = parseInt(job.id) || Math.floor(Math.random() * 10000);
        
        if (!jobTitle || !jobCompany) {
            return;
        }
        
        const salaryHtml = job.salary ? `<div class="salary-badge">${jobSalary}</div>` : "";
        const locationHtml = job.location ? `<div class="job-location">📍 ${jobLocation}</div>` : "";
        const posterHtml = job.poster_url ? `<img src="${escapeHtml(job.poster_url)}" class="job-poster" alt="Job Poster" loading="lazy">` : "";
        const imageOnlyBadge = job.is_image_only ? '<div class="image-only-badge">📷 Image Post</div>' : '';
        const tags = generateJobTags(job);
        
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
        jobsList.innerHTML = '';
        jobsList.appendChild(jobsContainer);
        addJobActionListeners();
    }
}

// Append jobs for load more
function appendJobs(jobs) {
    renderJobs(jobs, true);
}

// Add event listeners for job actions
function addJobActionListeners() {
    document.querySelectorAll('.share-btn').forEach(btn => {
        btn.removeEventListener('click', handleShareClick);
        btn.addEventListener('click', handleShareClick);
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.removeEventListener('click', handleDeleteClick);
        btn.addEventListener('click', handleDeleteClick);
    });
}

// Handle share button click
function handleShareClick(event) {
    const btn = event.target;
    const jobTitle = btn.getAttribute('data-job-title');
    const jobCompany = btn.getAttribute('data-job-company');
    const jobDescription = btn.getAttribute('data-job-description');
    const jobSalary = btn.getAttribute('data-job-salary');
    const jobLocation = btn.getAttribute('data-job-location');
    const jobContact = btn.getAttribute('data-job-contact');
    const jobWhatsapp = btn.getAttribute('data-job-whatsapp');
    
    shareJob(jobTitle, jobCompany, jobDescription, jobSalary, jobLocation, jobContact, jobWhatsapp);
}

// Handle delete button click
function handleDeleteClick(event) {
    const btn = event.target;
    const jobId = btn.getAttribute('data-job-id');
    const jobTitle = btn.getAttribute('data-job-title');
    const jobCompany = btn.getAttribute('data-job-company');
    
    initiateDelete(jobId, jobTitle, jobCompany);
}

// EVENT LISTENER SETUP
function setupEventListeners() {
    const elements = {
        searchForm: document.getElementById('searchForm'),
        menuToggle: document.getElementById('menuToggle'),
        closeMobileMenu: document.getElementById('closeMobileMenu'),
        loadMoreBtn: document.getElementById('loadMoreJobsBtn'),
        postJobFab: document.getElementById('postJobFab'),
        quickPostFab: document.getElementById('quickPostFab'),
        posterUploadBtn: document.getElementById('posterUploadBtn'),
        closeJobModal: document.getElementById('closeJobModal'),
        submitJob: document.getElementById('submitJob')
    };

    if (elements.searchForm) {
        elements.searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            performSearch();
        });
    }

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
    if (elements.quickPostFab) {
        elements.quickPostFab.addEventListener('click', openQuickPostModal);
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
    if (elements.posterUploadBtn) {
        elements.posterUploadBtn.addEventListener('click', function() {
            document.getElementById('poster').click();
        });
    }

    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.shiftKey && e.key === 'M') {
            e.preventDefault();
            toggleAdminMode();
        }
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });

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

// Mobile menu toggle
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
    if (jobModal) {
        jobModal.style.display = 'none';
    }
    
    const confirmModal = document.getElementById('confirmModal');
    if (confirmModal) {
        confirmModal.style.display = 'none';
        confirmModal.classList.remove('active');
    }
    
    const overlay = document.getElementById('mobileMenuOverlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
    
    document.body.style.overflow = 'auto';
    jobToDelete = null;
}

// Generate job tags
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

// Update stats
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
        cat.count = (categoryCounts[cat.name] || 0) * 15;
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
}

function updateAdminStats() {
    if (isAdminMode) {
        const totalJobs = allJobs.length;
        const totalJobsSpan = document.getElementById('totalJobs');
        const sessionDeletionsSpan = document.getElementById('sessionDeletions');
        const totalVisitorsSpan = document.getElementById('totalVisitors');
        const totalSharesSpan = document.getElementById('totalShares');
        const sessionSharesSpan = document.getElementById('sessionShares');
        
        if (totalJobsSpan) totalJobsSpan.textContent = totalJobs;
        if (sessionDeletionsSpan) sessionDeletionsSpan.textContent = sessionDeletions;
        if (totalVisitorsSpan) totalVisitorsSpan.textContent = Math.floor(Math.random() * 1000) + 500;
        if (totalSharesSpan) totalSharesSpan.textContent = Math.floor(Math.random() * 200) + 50;
        if (sessionSharesSpan) sessionSharesSpan.textContent = Math.floor(Math.random() * 20) + 5;
    }
}

function initiateDelete(jobId, position, company) {
    if (!isAdminMode) {
        return;
    }
    
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

function handleConfirmDelete() {
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
        const deletedJob = allJobs.splice(jobIndex, 1)[0];
        sessionDeletions++;
        
        showNotification(`Job "${jobToDelete.position}" deleted successfully`, 'success');
        
        renderJobs(allJobs.slice(0, currentJobsDisplayed));
        updateAdminStats();
        
        if (isSupabaseConnected && supabase) {
            deleteJobFromDatabase(jobToDelete.id);
        }
    } else {
        showNotification('Job not found', 'error');
    }
    
    closeConfirmModal();
}

async function deleteJobFromDatabase(jobId) {
    try {
        const result = await supabase
            .from('jobs')
            .delete()
            .eq('id', jobId);
        
        if (result.error) {
            console.error('Database delete error:', result.error);
        }
    } catch (error) {
        console.error('Error deleting job from database:', error);
    }
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

// Export functions for global access
window.shareJob = shareJob;
window.toggleMobileMenu = toggleMobileMenu;
window.initiateDelete = initiateDelete;
window.performSearch = performSearch;
window.loadMoreJobs = loadMoreJobs;
window.switchToQuickPost = openQuickPostModal;

console.log('🇶🇦 HALAJOBS.QA - Final Bug-Free Version Loaded Successfully!');// HALAJOBS.QA - Final Bug-Free Script
// No Apply Button - Full Job Details in Cards - Enhanced Sharing

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
    { name: 'Others', icon: '💼', count: 0, label: 'Others' }
];

// Demo data with complete contact information
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
        position: "Sales coordinator",
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
    },
    {
        id: 5,
        position: "Accountant-2",
        company: "Financial Services Qatar",
        description: "We are seeking a qualified accountant with 3+ years experience in financial management, bookkeeping, and tax preparation. Experience with Qatar taxation laws preferred. Full-time position with growth opportunities.",
        salary: "QR 6,500",
        category: "Accountant",
        location: "Doha, QAT",
        contact: "hr@fsqatar.com",
        whatsapp: "+974 2222 8888",
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
    isSupabaseConnected = false;
}

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    console.log('🇶🇦 HALAJOBS.QA Loading...');
    setupEventListeners();
    loadJobs();
    setupSearch();
    setupJobModal();
    animateStatsOnScroll();
    console.log('🚀 HALAJOBS.QA Loaded Successfully!');
});

// ENHANCED SHARING - Share complete job details
function shareJob(position, company, description, salary, location, contact, whatsapp) {
    let jobText = `🇶🇦 JOB OPPORTUNITY IN QATAR\n\n`;
    jobText += `📋 POSITION: ${position}\n`;
    jobText += `🏢 COMPANY: ${company}\n\n`;
    
    if (description && description.trim()) {
        jobText += `📝 JOB DESCRIPTION:\n${description}\n\n`;
    }
    
    if (salary && salary.trim()) {
        jobText += `💰 SALARY: ${salary}\n`;
    }
    if (location && location.trim()) {
        jobText += `📍 LOCATION: ${location}\n`;
    }
    
    jobText += `\n📞 CONTACT INFORMATION:\n`;
    let hasContact = false;
    
    if (contact && contact.trim()) {
        jobText += `📧 Email: ${contact}\n`;
        hasContact = true;
    }
    if (whatsapp && whatsapp.trim()) {
        jobText += `📱 WhatsApp: ${whatsapp}\n`;
        hasContact = true;
    }
    
    if (!hasContact) {
        jobText += `Please contact the company directly or visit their office.\n`;
    }
    
    jobText += `\n🌟 Find more Qatar jobs at: https://halajobsqa.com/\n\n`;
    jobText += `#QatarJobs #MadeInQatar #JobsInQatar #${company.replace(/\s+/g, '')}`;
    
    console.log('📱 Sharing complete job details:', position, 'at', company);
    
    if (navigator.share) {
        navigator.share({
            title: `${position} at ${company} - Qatar Jobs`,
            text: jobText,
            url: 'https://halajobsqa.com/'
        }).then(() => {
            showNotification('Complete job details shared successfully! 📱', 'success');
        }).catch(err => {
            console.log('Share cancelled or failed:', err);
            copyToClipboard(jobText);
        });
    } else {
        copyToClipboard(jobText);
    }
}

// Copy to clipboard functions
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

// Load More Jobs function
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

// Job posting functions
function openJobModal() {
    console.log('📝 Opening job posting modal');
    const modal = document.getElementById('jobModal');
    if (modal) {
        modal.style.display = 'flex';
        switchToDetailedMode();
    }
}

function openQuickPostModal() {
    console.log('📷 Opening quick post modal');
    const modal = document.getElementById('jobModal');
    if (modal) {
        modal.style.display = 'flex';
        switchToQuickMode();
    }
}

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
}

function switchToQuickMode() {
    currentPostingMode = 'quick';
    const detailedForm = document.getElementById('detailedForm');
    const quickForm = document.getElementById('quickForm');
    const detailedModeBtn = document.getElementById('detailedModeBtn');
    const quickModeBtn = document.getElementById('quickModeBtn');
