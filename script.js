// Configuration
const supabaseUrl = "https://ehoctsjvtfuesqeonlco.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVob2N0c2p2dGZ1ZXNxZW9ubGNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5OTU2ODcsImV4cCI6MjA3MjU3MTY4N30.kGz2t58YXWTwOB_h40dH0GOBLF12FQxKsZnqQ983Xro";
const ADMIN_PASSCODE = "451588";

// Global variables
let isAdminMode = false;
let sessionDeletions = 0;
let jobToDelete = null;
let currentPostingMode = 'detailed';
let supabase = null;
let isSupabaseConnected = false;

// Initialize Supabase
try {
  supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
  isSupabaseConnected = true;
  console.log("Supabase connected successfully!");
} catch (error) {
  console.warn("Supabase connection failed:", error.message);
  console.log("Using demo data instead");
}

// Demo data
let demoJobs = [
  {
    id: 1,
    position: "Software Engineer",
    company: "Tech Qatar",
    description: "Looking for experienced React developer to join our growing team. Must have 3+ years experience with React, Node.js, and modern web technologies. Competitive salary and benefits package included.",
    salary: "QR 8000/month",
    category: "IT",
    location: "Doha",
    contact: "hr@techqatar.com",
    created_at: new Date().toISOString(),
    poster_url: null,
    is_image_only: false
  },
  {
    id: 2,
    position: "Delivery Driver",
    company: "Quick Delivery",
    description: "Need reliable driver with valid Qatar license. Flexible hours, good pay. Must have own vehicle and smartphone. Experience with delivery apps preferred.",
    salary: "QR 3500/month + tips",
    category: "Delivery",
    location: "Al Rayyan",
    contact: null,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    poster_url: null,
    is_image_only: false
  }
];

// DOM Ready
document.addEventListener('DOMContentLoaded', function() {
  initializeApp();
});

function initializeApp() {
  // Show demo notice if not connected to Supabase
  if (!isSupabaseConnected) {
    const demoNotice = document.getElementById('demoNotice');
    if (demoNotice) demoNotice.style.display = "block";
  }

  // Add event listeners
  addEventListeners();
  
  // Load initial jobs
  loadJobs();

  // Set up auto-refresh if Supabase connected
  if (isSupabaseConnected) {
    setInterval(loadJobs, 5 * 60 * 1000);
  }

  console.log("Halajobs.qa initialized!");
  console.log(isSupabaseConnected ? 
    "Supabase connected - Full functionality enabled" : 
    "Demo mode - Configure Supabase for full functionality"
  );
  console.log("Admin shortcuts: Ctrl+Shift+M to toggle admin mode");
}

function addEventListeners() {
  // Modal events
  const openModal = document.getElementById('openModal');
  const openQuickModal = document.getElementById('openQuickModal');
  const closeModal = document.getElementById('closeModal');
  const submitJob = document.getElementById('submitJob');

  if (openModal) openModal.onclick = () => { switchPostingMode('detailed'); openJobModal(); };
  if (openQuickModal) openQuickModal.onclick = () => { switchPostingMode('quick'); openJobModal(); };
  if (closeModal) closeModal.onclick = () => closeJobModal();
  if (submitJob) submitJob.onclick = () => addJob();

  // Window click to close modal
  window.onclick = (e) => {
    const modal = document.getElementById('jobModal');
    if (e.target === modal) closeJobModal();
  };

  // Admin events
  const confirmDelete = document.getElementById('confirmDelete');
  const cancelDelete = document.getElementById('cancelDelete');
  if (confirmDelete) confirmDelete.onclick = () => confirmDeletion();
  if (cancelDelete) cancelDelete.onclick = () => cancelDelete();

  // Mode toggle events
  const detailedModeBtn = document.getElementById('detailedModeBtn');
  const quickModeBtn = document.getElementById('quickModeBtn');
  if (detailedModeBtn) detailedModeBtn.onclick = () => switchPostingMode('detailed');
  if (quickModeBtn) quickModeBtn.onclick = () => switchPostingMode('quick');

  // File input events
  const poster = document.getElementById('poster');
  if (poster) {
    poster.onchange = function() {
      const fileName = this.files[0] ? this.files[0].name : 'Click to upload job poster (optional)';
      const fileInput = document.querySelector('.file-input');
      if (fileInput) fileInput.textContent = fileName;
    };
  }

  // Quick upload events
  const quickUploadZone = document.getElementById('quickUploadZone');
  const quickPoster = document.getElementById('quickPoster');

  if (quickUploadZone) {
    quickUploadZone.onclick = () => {
      if (quickPoster) quickPoster.click();
    };

    quickUploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      quickUploadZone.classList.add('dragover');
    });

    quickUploadZone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      quickUploadZone.classList.remove('dragover');
    });

    quickUploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      quickUploadZone.classList.remove('dragover');
      
      const files = e.dataTransfer.files;
      if (files.length > 0 && files[0].type.startsWith('image/')) {
        handleQuickImageUpload(files[0]);
      }
    });
  }

  if (quickPoster) {
    quickPoster.onchange = function() {
      if (this.files[0]) {
        handleQuickImageUpload(this.files[0]);
      }
    };
  }

  // Search and filter events
  const search = document.getElementById('search');
  const categoryFilter = document.getElementById('categoryFilter');
  if (search) search.oninput = () => debounce(loadJobs, 300)();
  if (categoryFilter) categoryFilter.onchange = () => loadJobs();

  // Keyboard events
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'M') {
      e.preventDefault();
      toggleAdminMode();
    }
    if (e.key === 'Escape') {
      const modal = document.getElementById('jobModal');
      const confirmModal = document.getElementById('confirmModal');
      if (modal && modal.style.display === 'flex') {
        closeJobModal();
      }
      if (confirmModal && confirmModal.style.display === 'flex') {
        cancelDeleteAction();
      }
    }
  });
}

// Admin functions
function toggleAdminMode() {
  if (!isAdminMode) {
    const passcode = prompt("Enter admin passcode:");
    if (passcode === ADMIN_PASSCODE) {
      activateAdminMode();
    } else if (passcode !== null) {
      alert("Incorrect passcode!");
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
  
  document.querySelectorAll('.delete-btn').forEach(btn => btn.classList.add('admin-visible'));
  document.querySelectorAll('.job-id').forEach(id => id.classList.add('admin-visible'));
  document.querySelectorAll('.job-card').forEach(card => card.classList.add('admin-mode'));

  updateAdminStats();
  console.log("Admin mode activated");
}

function deactivateAdminMode() {
  isAdminMode = false;
  document.body.classList.remove('admin-mode');
  const adminPanel = document.getElementById('adminPanel');
  if (adminPanel) adminPanel.classList.remove('active');
  
  document.querySelectorAll('.delete-btn').forEach(btn => btn.classList.remove('admin-visible'));
  document.querySelectorAll('.job-id').forEach(id => id.classList.remove('admin-visible'));
  document.querySelectorAll('.job-card').forEach(card => card.classList.remove('admin-mode'));

  console.log("Admin mode deactivated");
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

// Modal functions
function openJobModal() {
  const modal = document.getElementById('jobModal');
  if (modal) {
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
  }
}

function closeJobModal() {
  const modal = document.getElementById('jobModal');
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

function clearForm() {
  document.querySelectorAll(".modal-content input, .modal-content textarea, .modal-content select").forEach(el => {
    if (el.type !== 'file') el.value = "";
  });
  
  const poster = document.getElementById('poster');
  const quickPoster = document.getElementById('quickPoster');
  const fileInput = document.querySelector('.file-input');
  const quickImagePreview = document.getElementById('quickImagePreview');
  const quickUploadZone = document.getElementById('quickUploadZone');
  
  if (poster) poster.value = "";
  if (quickPoster) quickPoster.value = "";
  if (fileInput) fileInput.textContent = 'Click to upload job poster (optional)';
  if (quickImagePreview) quickImagePreview.style.display = 'none';
  if (quickUploadZone) {
    quickUploadZone.innerHTML = '<h3>Upload Job Poster</h3><p>Drag and drop your job poster here or click to select</p><p style="font-size: 12px; color: #666;">Image should contain all job details</p>';
  }
}

function hideMessages() {
  const successMsg = document.getElementById('successMsg');
  const errorMsg = document.getElementById('errorMsg');
  if (successMsg) successMsg.style.display = "none";
  if (errorMsg) errorMsg.style.display = "none";
}

// Job loading and rendering
async function loadJobs() {
  const jobsList = document.getElementById('jobsList');
  if (!jobsList) return;
  
  jobsList.innerHTML = '<div class="loading"><div class="spinner"></div><span>Loading jobs...</span></div>';

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
        jobs = result.data || [];
        if (jobs.length === 0) {
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
  }

  renderJobs(jobs);
  updateAdminStats();
}

function renderJobs(jobs) {
  const jobsList = document.getElementById('jobsList');
  const search = document.getElementById('search');
  const categoryFilter = document.getElementById('categoryFilter');
  
  if (!jobsList || !search || !categoryFilter) return;
  
  const searchTerm = search.value.toLowerCase().trim();
  const category = categoryFilter.value;

  const filtered = jobs.filter(job => {
    const matchesCategory = category === "all" || job.category === category;
    const matchesSearch = !searchTerm || 
      job.position.toLowerCase().includes(searchTerm) || 
      job.description.toLowerCase().includes(searchTerm) ||
      job.company.toLowerCase().includes(searchTerm) ||
      (job.location && job.location.toLowerCase().includes(searchTerm));
    return matchesCategory && matchesSearch;
  });

  if (filtered.length === 0) {
    jobsList.innerHTML = '<div style="text-align:center;padding:40px;color:#888;"><h3>No jobs found</h3><p>Try adjusting your search criteria or post a new job!</p></div>';
    updateAdminStats();
    return;
  }

  jobsList.innerHTML = "";
  filtered.forEach(job => {
    const div = document.createElement("div");
    div.className = "job-card";
    if (isAdminMode) div.classList.add('admin-mode');
    
    const salaryHtml = job.salary ? `<div class="meta-item">Salary: ${escapeHtml(job.salary)}</div>` : "";
    const locationHtml = job.location ? `<div class="meta-item">Location: ${escapeHtml(job.location)}</div>` : "";
    const contactHtml = job.contact ? `<div class="meta-item">Contact: ${escapeHtml(job.contact)}</div>` : "";
    const posterHtml = job.poster_url ? `<img src="${escapeHtml(job.poster_url)}" class="job-poster" alt="Job Poster" loading="lazy">` : "";
    const imageOnlyBadge = job.is_image_only ? '<div class="image-only-badge">Image Post</div>' : '';
    
    let jobContent = '';
    if (job.is_image_only) {
      jobContent = `<h3>${escapeHtml(job.position || 'Job Opportunity')} - ${escapeHtml(job.company || 'Company')}</h3>
        <p>See image for full job details</p>`;
    } else {
      jobContent = `<h3>${escapeHtml(job.position)} - ${escapeHtml(job.company)}</h3>
        <p>${escapeHtml(job.description)}</p>`;
    }
    
    div.innerHTML = `
      <div class="job-id ${isAdminMode ? 'admin-visible' : ''}">ID: ${job.id}</div>
      ${imageOnlyBadge}
      ${jobContent}
      <div class="job-meta">
        <div class="meta-item">Category: ${escapeHtml(job.category || 'Others')}</div>
        ${salaryHtml}
        ${locationHtml}
        ${contactHtml}
      </div>
      ${posterHtml}
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:15px;">
        <small>Posted: ${formatDate(job.created_at)}</small>
        <div>
          <button class="share-btn" onclick="shareJob('${escapeForJS(job.position || 'Job Opportunity')}', '${escapeForJS(job.company || 'Company')}', '${escapeForJS(job.description || 'See image for details')}')">Share</button>
          <button class="delete-btn ${isAdminMode ? 'admin-visible' : ''}" onclick="initiateDelete(${job.id}, '${escapeForJS(job.position || 'Job Opportunity')}', '${escapeForJS(job.company || 'Company')}')">Delete</button>
        </div>
      </div>`;
    jobsList.appendChild(div);
  });

  updateAdminStats();
}

// Utility functions
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text.toString();
  return div.innerHTML;
}

function escapeForJS(text) {
  if (!text) return '';
  return text.toString().replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r');
}

function formatDate(dateString) {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return 'Recently';
  }
}

// Share function - Updated with modal
function shareJob(position, company, description) {
  currentShareData = {
    position: position,
    company: company,
    description: description,
    text: `${position} at ${company}\n\n${description}\n\nFind more jobs at: https://farisconnects.github.io/halajobs-qa/`
  };
  
  const shareModal = document.getElementById('shareModal');
  const shareJobTitle = document.getElementById('shareJobTitle');
  
  if (shareJobTitle) {
    shareJobTitle.textContent = `${position} - ${company}`;
  }
  
  if (shareModal) {
    shareModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeShareModal() {
  const shareModal = document.getElementById('shareModal');
  if (shareModal) {
    shareModal.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
  currentShareData = null;
}

function shareToWhatsApp() {
  if (!currentShareData) return;
  
  const text = encodeURIComponent(currentShareData.text);
  const whatsappUrl = `https://wa.me/?text=${text}`;
  window.open(whatsappUrl, '_blank');
  closeShareModal();
}

function shareToFacebook() {
  if (!currentShareData) return;
  
  const url = encodeURIComponent('https://farisconnects.github.io/halajobs-qa/');
  const quote = encodeURIComponent(`${currentShareData.position} at ${currentShareData.company}`);
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${quote}`;
  window.open(facebookUrl, '_blank');
  closeShareModal();
}

function copyJobLink() {
  if (!currentShareData) return;
  
  if (navigator.clipboard) {
    navigator.clipboard.writeText(currentShareData.text).then(() => {
      showTemporaryMessage("Job details copied to clipboard!");
      closeShareModal();
    }).catch(() => {
      fallbackCopyTextToClipboard(currentShareData.text);
      closeShareModal();
    });
  } else {
    fallbackCopyTextToClipboard(currentShareData.text);
    closeShareModal();
  }
}

function fallbackCopyTextToClipboard(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-999999px";
  textArea.style.top = "-999999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  try {
    document.execCommand('copy');
    showTemporaryMessage("Job details copied to clipboard!");
  } catch (err) {
    showTemporaryMessage("Please manually copy this job info: " + text);
  }
  
  document.body.removeChild(textArea);
}

function showTemporaryMessage(message) {
  const messageDiv = document.createElement('div');
  messageDiv.style.cssText = 
    'position: fixed; top: 20px; left: 50%; transform: translateX(-50%);' +
    'background: #28a745; color: white; padding: 12px 20px; border-radius: 8px;' +
    'z-index: 3001; font-weight: 500; box-shadow: 0 4px 15px rgba(40,167,69,0.3);' +
    'animation: slideInSuccess 0.3s ease; max-width: 90%; text-align: center;';
  messageDiv.textContent = message;
  document.body.appendChild(messageDiv);
  
  setTimeout(() => {
    if (document.body.contains(messageDiv)) {
      messageDiv.style.animation = 'fadeOut 0.3s ease';
      setTimeout(() => {
        if (document.body.contains(messageDiv)) {
          document.body.removeChild(messageDiv);
        }
      }, 300);
    }
  }, 2500);
}

// Delete functions
function initiateDelete(jobId, position, company) {
  if (!isAdminMode) return;
  
  jobToDelete = parseInt(jobId);
  const jobDetails = document.getElementById('jobDetails');
  const confirmModal = document.getElementById('confirmModal');
  const deletePasscode = document.getElementById('deletePasscode');
  
  if (jobDetails) {
    jobDetails.innerHTML = `<strong>Job ID:</strong> ${jobId}<br><strong>Position:</strong> ${position}<br><strong>Company:</strong> ${company}`;
  }
  if (deletePasscode) deletePasscode.value = '';
  if (confirmModal) confirmModal.style.display = 'flex';
}

async function confirmDeletion() {
  const deletePasscode = document.getElementById('deletePasscode');
  if (!deletePasscode || deletePasscode.value !== ADMIN_PASSCODE) {
    alert("Incorrect passcode!");
    return;
  }

  if (!jobToDelete) return;

  const confirmBtn = document.getElementById('confirmDelete');
  if (!confirmBtn) return;
  
  const originalText = confirmBtn.textContent;
  confirmBtn.textContent = "Deleting...";
  confirmBtn.disabled = true;

  try {
    let deleteSuccess = false;
    
    if (isSupabaseConnected) {
      const deleteResult = await supabase
        .from("jobs")
        .delete()
        .eq('id', jobToDelete);
        
      if (!deleteResult.error) {
        deleteSuccess = true;
      }
    }
    
    //
