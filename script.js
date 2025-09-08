// Configuration with your Supabase credentials
const supabaseUrl = "https://ehoctsjvtfuesqeonlco.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVob2N0c2p2dGZ1ZXNxZW9ubGNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5OTU2ODcsImV4cCI6MjA3MjU3MTY4N30.kGz2t58YXWTwOB_h40dH0GOBLF12FQxKsZnqQ983Xro";

// Admin configuration
const ADMIN_PASSCODE = "451588";
let isAdminMode = false;
let sessionDeletions = 0;
let jobToDelete = null;
let currentPostingMode = 'detailed'; // 'detailed' or 'quick'

// Initialize Supabase client
let supabase = null;
let isSupabaseConnected = false;

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

// DOM elements
const jobsList = document.getElementById('jobsList');
const modal = document.getElementById('jobModal');
const openModal = document.getElementById('openModal');
const openQuickModal = document.getElementById('openQuickModal');
const closeModal = document.getElementById('closeModal');
const submitJob = document.getElementById('submitJob');
const successMsg = document.getElementById('successMsg');
const errorMsg = document.getElementById('errorMsg');
const search = document.getElementById('search');
const categoryFilter = document.getElementById('categoryFilter');
const demoNotice = document.getElementById('demoNotice');
const adminPanel = document.getElementById('adminPanel');
const confirmModal = document.getElementById('confirmModal');
const totalJobsSpan = document.getElementById('totalJobs');
const sessionDeletionsSpan = document.getElementById('sessionDeletions');
const detailedModeBtn = document.getElementById('detailedModeBtn');
const quickModeBtn = document.getElementById('quickModeBtn');
const detailedForm = document.getElementById('detailedForm');
const quickForm = document.getElementById('quickForm');
const quickUploadZone = document.getElementById('quickUploadZone');
const quickPoster = document.getElementById('quickPoster');
const quickImagePreview = document.getElementById('quickImagePreview');

// Show demo notice if not connected to Supabase
if (!isSupabaseConnected) {
  demoNotice.style.display = "block";
}

// Admin mode toggle
document.addEventListener('keydown', function(e) {
  if (e.ctrlKey && e.shiftKey && e.key === 'M') {
    e.preventDefault();
    toggleAdminMode();
  }
  if (e.key === 'Escape') {
    if (modal.style.display === 'flex') {
      closeJobModal();
    }
    if (confirmModal.style.display === 'flex') {
      cancelDelete();
    }
  }
});

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
  adminPanel.classList.add('active');
  
  // Show delete buttons and job IDs
  const deleteButtons = document.querySelectorAll('.delete-btn');
  deleteButtons.forEach(function(btn) {
    btn.classList.add('admin-visible');
  });
  
  const jobIds = document.querySelectorAll('.job-id');
  jobIds.forEach(function(id) {
    id.classList.add('admin-visible');
  });
  
  const jobCards = document.querySelectorAll('.job-card');
  jobCards.forEach(function(card) {
    card.classList.add('admin-mode');
  });

  updateAdminStats();
  console.log("🔐 Admin mode activated");
}

function deactivateAdminMode() {
  isAdminMode = false;
  document.body.classList.remove('admin-mode');
  adminPanel.classList.remove('active');
  
  // Hide delete buttons and job IDs
  const deleteButtons = document.querySelectorAll('.delete-btn');
  deleteButtons.forEach(function(btn) {
    btn.classList.remove('admin-visible');
  });
  
  const jobIds = document.querySelectorAll('.job-id');
  jobIds.forEach(function(id) {
    id.classList.remove('admin-visible');
  });
  
  const jobCards = document.querySelectorAll('.job-card');
  jobCards.forEach(function(card) {
    card.classList.remove('admin-mode');
  });

  console.log("🔓 Admin mode deactivated");
}

function updateAdminStats() {
  if (isAdminMode) {
    const totalJobs = document.querySelectorAll('.job-card').length;
    totalJobsSpan.textContent = totalJobs;
    sessionDeletionsSpan.textContent = sessionDeletions;
  }
}

// Posting mode toggle
detailedModeBtn.onclick = function() {
  switchPostingMode('detailed');
};

quickModeBtn.onclick = function() {
  switchPostingMode('quick');
};

function switchPostingMode(mode) {
  currentPostingMode = mode;
  
  if (mode === 'detailed') {
    detailedModeBtn.classList.add('active');
    quickModeBtn.classList.remove('active');
    detailedForm.style.display = 'block';
    quickForm.style.display = 'none';
  } else {
    quickModeBtn.classList.add('active');
    detailedModeBtn.classList.remove('active');
    detailedForm.style.display = 'none';
    quickForm.style.display = 'block';
  }
}

// Event listeners
openModal.onclick = function() { 
  switchPostingMode('detailed');
  openJobModal(); 
};

openQuickModal.onclick = function() { 
  switchPostingMode('quick');
  openJobModal(); 
};

closeModal.onclick = function() { closeJobModal(); };
window.onclick = function(e) { 
  if (e.target == modal) closeJobModal(); 
};
submitJob.onclick = function() { addJob(); };

// Confirmation modal events
document.getElementById('confirmDelete').onclick = function() { confirmDeletion(); };
document.getElementById('cancelDelete').onclick = function() { cancelDelete(); };

// File input display for detailed form
document.getElementById('poster').onchange = function() {
  const fileName = this.files[0] ? this.files[0].name : 'Click to upload job poster (optional)';
  document.querySelector('.file-input').textContent = '📁 ' + fileName;
};

// Quick upload zone events
quickUploadZone.onclick = function() {
  quickPoster.click();
};

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
    handleQuickImageUpload(files[0]);
  }
});

quickPoster.onchange = function() {
  if (this.files[0]) {
    handleQuickImageUpload(this.files[0]);
  }
};

function handleQuickImageUpload(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    quickImagePreview.src = e.target.result;
    quickImagePreview.style.display = 'block';
    quickUploadZone.innerHTML = '<p style="color: #28a745; font-weight: bold;">✅ Image uploaded successfully!</p><p style="font-size: 12px;">Click to change image</p>';
    
    // Try to extract basic info from filename
    const filename = file.name.toLowerCase();
    if (!document.getElementById('quickTitle').value) {
      extractTitleFromFilename(filename);
    }
  };
  reader.readAsDataURL(file);
}

function extractTitleFromFilename(filename) {
  // Simple extraction logic - you could make this more sophisticated
  const titleInput = document.getElementById('quickTitle');
  const categorySelect = document.getElementById('quickCategory');
  
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

// Search and filter event listeners with debouncing
search.oninput = function() { 
  debounce(loadJobs, 300)(); 
};
categoryFilter.onchange = function() { 
  loadJobs(); 
};

function openJobModal() {
  modal.style.display = "flex";
  document.body.style.overflow = "hidden";
}

function closeJobModal() {
  modal.style.display = "none";
  document.body.style.overflow = "auto";
  clearForm();
  hideMessages();
}

function clearForm() {
  const inputs = document.querySelectorAll(".modal-content input, .modal-content textarea, .modal-content select");
  inputs.forEach(function(el) {
    if (el.type !== 'file') {
      el.value = "";
    }
  });
  document.getElementById('poster').value = "";
  document.getElementById('quickPoster').value = "";
  document.querySelector('.file-input').textContent = '📁 Click to upload job poster (optional)';
  quickImagePreview.style.display = 'none';
  quickUploadZone.innerHTML = '<h3>📷 Upload Job Poster</h3><p>Drag & drop your job poster here or click to select</p><p style="font-size: 12px; color: #666;">Image should contain all job details</p>';
}

function hideMessages() {
  successMsg.style.display = "none";
  errorMsg.style.display = "none";
}

async function loadJobs() {
  jobsList.innerHTML = '<div class="loading"><div class="spinner"></div><span>Loading jobs...</span></div>';

  let jobs = [];
  
  if (isSupabaseConnected) {
    try {
      console.log("Fetching jobs from Supabase...");
      let result = await supabase
        .from("jobs")
        .select("*")
        .order("created_at", { ascending: false });

      if (result.error) {
        console.error("Supabase fetch error:", result.error);
        console.log("Falling back to demo data");
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
      console.log("Using demo data instead");
      jobs = demoJobs.slice();
    }
  } else {
    await new Promise(function(resolve) { setTimeout(resolve, 1000); });
    jobs = demoJobs.slice();
    console.log("Demo mode: Loaded", jobs.length, "jobs");
  }

  renderJobs(jobs);
  updateAdminStats();
}

function renderJobs(jobs) {
  const searchTerm = search.value.toLowerCase().trim();
  const category = categoryFilter.value;

  const filtered = jobs.filter(function(job) {
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
  filtered.forEach(function(job) {
    const div = document.createElement("div");
    div.className = "job-card";
    if (isAdminMode) {
      div.classList.add('admin-mode');
    }
    
    const salaryHtml = job.salary ? '<div class="meta-item">💰 ' + escapeHtml(job.salary) + '</div>' : "";
    const locationHtml = job.location ? '<div class="meta-item">📍 ' + escapeHtml(job.location) + '</div>' : "";
    const contactHtml = job.contact ? '<div class="meta-item">📧 ' + escapeHtml(job.contact) + '</div>' : "";
    const posterHtml = job.poster_url ? '<img src="' + escapeHtml(job.poster_url) + '" class="job-poster" alt="Job Poster" loading="lazy">' : "";
    const imageOnlyBadge = job.is_image_only ? '<div class="image-only-badge">📷 Image Post</div>' : '';
    
    // For image-only posts, show minimal text info
    let jobContent = '';
    if (job.is_image_only) {
      jobContent = '<h3>' + escapeHtml(job.position || 'Job Opportunity') + ' - ' + escapeHtml(job.company || 'Company') + '</h3>' +
        '<p>📋 See image for full job details</p>';
    } else {
      jobContent = '<h3>' + escapeHtml(job.position) + ' - ' + escapeHtml(job.company) + '</h3>' +
        '<p>📋 ' + escapeHtml(job.description) + '</p>';
    }
    
    div.innerHTML = '<div class="job-id ' + (isAdminMode ? 'admin-visible' : '') + '">ID: ' + job.id + '</div>' +
      imageOnlyBadge +
      jobContent +
      '<div class="job-meta">' +
        '<div class="meta-item">🏷️ ' + escapeHtml(job.category || 'Others') + '</div>' +
        salaryHtml +
        locationHtml +
        contactHtml +
      '</div>' +
      posterHtml +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:15px;">' +
        '<small>📅 ' + formatDate(job.created_at) + '</small>' +
        '<div>' +
          '<button class="share-btn" onclick="shareJob(\'' + escapeHtml(job.position || 'Job Opportunity').replace(/'/g, "\\'") + '\', \'' + escapeHtml(job.company || 'Company').replace(/'/g, "\\'") + '\', \'' + escapeHtml(job.description || 'See image for details').replace(/'/g, "\\'") + '\')">📤 Share</button>' +
          '<button class="delete-btn ' + (isAdminMode ? 'admin-visible' : '') + '" onclick="initiateDelete(' + job.id + ', \'' + escapeHtml(job.position || 'Job Opportunity').replace(/'/g, "\\'") + '\', \'' + escapeHtml(job.company || 'Company').replace(/'/g, "\\'") + '\')">🗑️ Delete</button>' +
        '</div>' +
      '</div>';
    jobsList.appendChild(div);
  });

  updateAdminStats();
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text.toString();
  return div.innerHTML;
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

function initiateDelete(jobId, position, company) {
  if (!isAdminMode) return;
  
  console.log("Initiating delete for job ID:", jobId);
  
  jobToDelete = parseInt(jobId);
  document.getElementById('jobDetails').innerHTML = 
    '<strong>Job ID:</strong> ' + jobId + '<br>' +
    '<strong>Position:</strong> ' + position + '<br>' +
    '<strong>Company:</strong> ' + company;
  document.getElementById('deletePasscode').value = '';
  confirmModal.style.display = 'flex';
  
  console.log("Job to delete set to:", jobToDelete, "(type:", typeof jobToDelete, ")");
}

async function confirmDeletion() {
  const enteredPasscode = document.getElementById('deletePasscode').value;
  
  if (enteredPasscode !== ADMIN_PASSCODE) {
    alert("❌ Incorrect passcode!");
    return;
  }

  if (!jobToDelete) return;

  const confirmBtn = document.getElementById('confirmDelete');
  const originalText = confirmBtn.textContent;
  confirmBtn.textContent = "🔄 Deleting...";
  confirmBtn.disabled = true;

  try {
    let deleteSuccess = false;
    let errorMessage = "";
    
    if (isSupabaseConnected) {
      console.log("Attempting to delete job ID:", jobToDelete, "from Supabase");
      
      const existingJobResult = await supabase
        .from("jobs")
        .select("*")
        .eq('id', jobToDelete)
        .single();

      if (existingJobResult.error) {
        console.error("Job fetch error:", existingJobResult.error);
        errorMessage = "Cannot find job: " + existingJobResult.error.message;
      } else if (!existingJobResult.data) {
        console.error("Job not found in database");
        errorMessage = "Job not found in database";
      } else {
        console.log("Job found, attempting deletion:", existingJobResult.data);
        
        const deleteResult = await supabase
          .from("jobs")
          .delete()
          .eq('id', jobToDelete)
          .select();
          
        if (deleteResult.error) {
          console.error("Supabase delete error:", deleteResult.error);
          
          if (deleteResult.error.code === '42501' || deleteResult.error.message.includes('policy')) {
            errorMessage = "❌ Permission denied: Row Level Security policy blocks deletion. Please check your Supabase RLS policies for the 'jobs' table.";
          } else if (deleteResult.error.code === 'PGRST116') {
            errorMessage = "❌ No rows found to delete. Job may have already been deleted.";
          } else {
            errorMessage = "❌ Database error: " + deleteResult.error.message;
          }
          
          const originalLength = demoJobs.length;
          demoJobs = demoJobs.filter(function(job) { return job.id != jobToDelete; });
          if (demoJobs.length < originalLength) {
            deleteSuccess = true;
            console.log("Fallback: Deleted from local demo data");
          }
        } else {
          console.log("Supabase delete successful:", deleteResult.data);
          deleteSuccess = true;
          
          demoJobs = demoJobs.filter(function(job) { return job.id != jobToDelete; });
        }
      }
    } else {
      const originalLength = demoJobs.length;
      demoJobs = demoJobs.filter(function(job) { return job.id != jobToDelete; });
      deleteSuccess = demoJobs.length < originalLength;
      console.log("Demo mode: Deleted job", jobToDelete, ", remaining jobs:", demoJobs.length);
    }

    if (deleteSuccess) {
      sessionDeletions++;
      console.log("🗑️ Admin deleted job ID:", jobToDelete, "at", new Date().toLocaleString());
      
      const jobCards = document.querySelectorAll('.job-card');
      let cardFound = false;
      
      jobCards.forEach(function(card) {
        const jobIdElement = card.querySelector('.job-id');
        if (jobIdElement && jobIdElement.textContent.includes('ID: ' + jobToDelete)) {
          cardFound = true;
          card.style.transition = 'all 0.5s ease';
          card.style.transform = 'translateX(-100%)';
          card.style.opacity = '0';
          setTimeout(function() {
            if (card.parentNode) {
              card.parentNode.removeChild(card);
              updateAdminStats();
            }
          }, 500);
        }
      });
      
      if (!cardFound) {
        console.log("Job card not found in DOM, forcing reload");
        setTimeout(function() { loadJobs(); }, 100);
      }
      
      cancelDelete();
      showDeletionSuccess();
      
    } else {
      console.error("Deletion failed:", errorMessage);
      alert(errorMessage || "❌ Failed to delete job. It may have already been deleted or you don't have permission.");
    }

  } catch (error) {
    console.error("Unexpected error during deletion:", error);
    alert("❌ Unexpected error: " + error.message);
  } finally {
    confirmBtn.textContent = originalText;
    confirmBtn.disabled = false;
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
  
  setTimeout(function() {
    if (document.body.contains(successDiv)) {
      successDiv.style.animation = 'fadeOut 0.3s ease';
      setTimeout(function() {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv);
        }
      }, 300);
    }
  }, 2000);
}

function cancelDelete() {
  confirmModal.style.display = 'none';
  jobToDelete = null;
  document.getElementById('deletePasscode').value = '';
}

async function addJob() {
  if (currentPostingMode === 'detailed') {
    await addDetailedJob();
  } else {
    await addQuickJob();
  }
}

async function addDetailedJob() {
  const position = document.getElementById("position").value.trim();
  const description = document.getElementById("description").value.trim();
  const salary = document.getElementById("salary").value.trim();
  const company = document.getElementById("company").value.trim();
  const location = document.getElementById("location").value.trim();
  const category = document.getElementById("category").value;
  const contact = document.getElementById("contact").value.trim();
  const poster = document.getElementById("poster").files[0];

  if (!position || !description || !company || !category) {
    showError("Please fill in all required fields (marked with *)");
    return;
  }

  if (contact && !isValidEmail(contact)) {
    showError("Please enter a valid email address");
    return;
  }

  await processJobSubmission({
    position: position,
    description: description,
    salary: salary || null,
    company: company,
    location: location || null,
    category: category,
    contact: contact || null,
    is_image_only: false
  }, poster);
}

async function addQuickJob() {
  const poster = quickPoster.files[0];
  
  if (!poster) {
    showError("Please upload a job poster image");
    return;
  }

  const quickTitle = document.getElementById("quickTitle").value.trim();
  const quickCompany = document.getElementById("quickCompany").value.trim();
  const quickCategory = document.getElementById("quickCategory").value;

  await processJobSubmission({
    position: quickTitle || "Job Opportunity",
    description: "Please see the attached image for complete job details and requirements.",
    salary: null,
    company: quickCompany || "Company",
    location: null,
    category: quickCategory || "Others",
    contact: null,
    is_image_only: true
  }, poster);
}

async function processJobSubmission(jobData, poster) {
  submitJob.disabled = true;
  submitJob.textContent = "🔄 Posting...";
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
        newJob.id = Math.max.apply(Math, demoJobs.map(function(j) { return j.id; }).concat([0])) + 1;
        demoJobs.unshift(newJob);
      }
    } else {
      newJob.id = Math.max.apply(Math, demoJobs.map(function(j) { return j.id; }).concat([0])) + 1;
      demoJobs.unshift(newJob);
    }

    showSuccess("Job posted successfully! 🎉");
    
    setTimeout(function() {
      closeJobModal();
      loadJobs();
    }, 2000);

  } catch (error) {
    console.error("Error posting job:", error);
    showError("Failed to post job. Please try again.");
  } finally {
    submitJob.disabled = false;
    submitJob.textContent = "🚀 Post Job";
  }
}

function showSuccess(message) {
  successMsg.textContent = message;
  successMsg.style.display = "block";
  errorMsg.style.display = "none";
}

function showError(message) {
  errorMsg.textContent = message;
  errorMsg.style.display = "block";
  successMsg.style.display = "none";
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function shareJob(position, company, description) {
  const text = '🔹 ' + position + ' at ' + company + '\n\n📋 ' + description + '\n\n🌐 Find more jobs at: https://farisconnects.github.io/halajobs-qa/';
  
  if (navigator.share) {
    navigator.share({ 
      title: position + ' - ' + company,
      text: text 
    }).catch(function(err) { 
      console.log('Share cancelled'); 
    });
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(function() {
      showTemporaryMessage("✅ Job details copied to clipboard! Share it anywhere.");
    }).catch(function() {
      fallbackCopyTextToClipboard(text);
    });
  } else {
    fallbackCopyTextToClipboard(text);
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
    showTemporaryMessage("✅ Job details copied to clipboard!");
  } catch (err) {
    showTemporaryMessage("📋 Please manually copy this job info:\n\n" + text);
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
  
  setTimeout(function() {
    if (document.body.contains(messageDiv)) {
      messageDiv.style.animation = 'fadeOut 0.3s ease';
      setTimeout(function() {
        if (document.body.contains(messageDiv)) {
          document.body.removeChild(messageDiv);
        }
      }, 300);
    }
  }, 2500);
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction() {
    const args = arguments;
    const later = function() {
      clearTimeout(timeout);
      func.apply(null, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Initialize
loadJobs();

if (isSupabaseConnected) {
  setInterval(loadJobs, 5 * 60 * 1000);
}

console.log("🇶🇦 Halajobs.qa initialized!");
console.log(isSupabaseConnected ? 
  "✅ Supabase connected - Full functionality enabled" : 
  "ℹ️ Demo mode - Configure Supabase for full functionality"
);
console.log("🔐 Admin shortcuts: Ctrl+Shift+M to toggle admin mode");
