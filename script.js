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
let currentShareData = null;

// Initialize Supabase
try {
  supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
  isSupabaseConnected = true;
  console.log("✅ Supabase connected successfully!");
} catch (error) {
  console.warn("⚠️ Supabase connection failed:", error.message);
  console.log("Using demo data instead");
}

// Demo data
let demoJobs = [
  {
    id: 1,
    position: "Software Engineer",
    company: "Tech Qatar",
    description: "Looking for experienced React developer...",
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
    description: "Need reliable driver with valid Qatar license...",
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
  if (!isSupabaseConnected) {
    const demoNotice = document.getElementById('demoNotice');
    if (demoNotice) demoNotice.style.display = "block";
  }

  addEventListeners();
  loadJobs();

  if (isSupabaseConnected) {
    setInterval(loadJobs, 5 * 60 * 1000);
  }

  console.log("🇶🇦 Halajobs.qa initialized!");
  console.log(isSupabaseConnected ? "✅ Supabase connected" : "ℹ️ Demo mode");
}

// === Event Listeners ===
function addEventListeners() {
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

  // Admin confirm/cancel
  const confirmDeleteBtn = document.getElementById('confirmDelete');
  const cancelDeleteBtn = document.getElementById('cancelDelete');
  if (confirmDeleteBtn) confirmDeleteBtn.onclick = () => confirmDeletion();
  if (cancelDeleteBtn) cancelDeleteBtn.onclick = () => cancelDeleteAction();

  // Mode toggle
  const detailedModeBtn = document.getElementById('detailedModeBtn');
  const quickModeBtn = document.getElementById('quickModeBtn');
  if (detailedModeBtn) detailedModeBtn.onclick = () => switchPostingMode('detailed');
  if (quickModeBtn) quickModeBtn.onclick = () => switchPostingMode('quick');

  // Search and filter
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
      if (modal && modal.style.display === 'flex') closeJobModal();
      if (confirmModal && confirmModal.style.display === 'flex') cancelDeleteAction();
    }
  });
}

// === Admin Mode ===
function toggleAdminMode() {
  if (!isAdminMode) {
    const passcode = prompt("🔐 Enter admin passcode:");
    if (passcode === ADMIN_PASSCODE) activateAdminMode();
    else if (passcode !== null) alert("❌ Incorrect passcode!");
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
  console.log("Admin mode activated");
}

function deactivateAdminMode() {
  isAdminMode = false;
  document.body.classList.remove('admin-mode');
  const adminPanel = document.getElementById('adminPanel');
  if (adminPanel) adminPanel.classList.remove('active');
  document.querySelectorAll('.delete-btn').forEach(btn => btn.classList.remove('admin-visible'));
  console.log("Admin mode deactivated");
}

// === Jobs ===
async function loadJobs() {
  const jobsList = document.getElementById('jobsList');
  if (!jobsList) return;

  jobsList.innerHTML = '<div class="loading"><span>Loading...</span></div>';

  let jobs = [];
  if (isSupabaseConnected) {
    try {
      const result = await supabase.from("jobs").select("*").order("created_at", { ascending: false });
      jobs = result.data || [];
    } catch (err) {
      console.error("Supabase error:", err);
      jobs = demoJobs.slice();
    }
  } else {
    jobs = demoJobs.slice();
  }

  renderJobs(jobs);
}

function renderJobs(jobs) {
  const jobsList = document.getElementById('jobsList');
  if (!jobsList) return;

  jobsList.innerHTML = "";
  jobs.forEach(job => {
    const div = document.createElement("div");
    div.className = "job-card";
    div.innerHTML = `
      <div class="job-id ${isAdminMode ? 'admin-visible' : ''}">ID: ${job.id}</div>
      <h3>${escapeHtml(job.position)} - ${escapeHtml(job.company)}</h3>
      <p>${escapeHtml(job.description)}</p>
      <div class="job-meta">
        <div>${job.category}</div>
        <div>${job.salary || ''}</div>
      </div>
      <button class="share-btn" onclick="shareJob('${escapeForJS(job.position)}','${escapeForJS(job.company)}','${escapeForJS(job.description)}')">Share</button>
      <button class="delete-btn ${isAdminMode ? 'admin-visible' : ''}" onclick="initiateDelete(${job.id},'${escapeForJS(job.position)}','${escapeForJS(job.company)}')">Delete</button>
    `;
    jobsList.appendChild(div);
  });
}

// === Share ===
function shareJob(position, company, description) {
  currentShareData = {
    text: `${position} at ${company}\n\n${description}\n\n🌐 halajobsqa.com`
  };
  if (navigator.share) {
    navigator.share({
      title: `${position} - ${company}`,
      text: currentShareData.text
    });
  } else {
    fallbackCopyTextToClipboard(currentShareData.text);
  }
}

function fallbackCopyTextToClipboard(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand('copy');
  document.body.removeChild(textArea);
  alert("✅ Job copied to clipboard!");
}

// === Delete ===
function initiateDelete(jobId, position, company) {
  if (!isAdminMode) return;
  jobToDelete = jobId;
  const confirmModal = document.getElementById('confirmModal');
  const jobDetails = document.getElementById('jobDetails');
  if (jobDetails) jobDetails.innerHTML = `Delete ${position} at ${company}?`;
  if (confirmModal) confirmModal.style.display = 'flex';
}

async function confirmDeletion() {
  const deletePasscode = document.getElementById('deletePasscode');
  if (!deletePasscode || deletePasscode.value !== ADMIN_PASSCODE) {
    alert("❌ Wrong passcode");
    return;
  }

  try {
    if (isSupabaseConnected) {
      await supabase.from("jobs").delete().eq('id', jobToDelete);
    }
    demoJobs = demoJobs.filter(job => job.id !== jobToDelete);
    loadJobs();
    cancelDeleteAction();
    alert("✅ Job deleted");
  } catch (err) {
    console.error("Delete error:", err);
    alert("❌ Failed to delete job");
  }
}

function cancelDeleteAction() {
  const confirmModal = document.getElementById('confirmModal');
  if (confirmModal) confirmModal.style.display = 'none';
  jobToDelete = null;
}

// === Utils ===
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
function escapeForJS(text) {
  if (!text) return '';
  return text.replace(/'/g, "\\'").replace(/"/g, '\\"');
}
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
