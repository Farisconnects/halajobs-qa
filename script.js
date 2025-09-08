// ===============================
// 🔗 Supabase Configuration
// ===============================
const supabaseUrl = "https://ehoctsjvtfuesqeonlco.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVob2N0c2p2dGZ1ZXNxZW9ubGNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5OTU2ODcsImV4cCI6MjA3MjU3MTY4N30.kGz2t58YXWTwOB_h40dH0GOBLF12FQxKsZnqQ983Xro";

// ===============================
// 🔐 Admin Configuration
// ===============================
const ADMIN_PASSCODE = "451588";
let isAdminMode = false;
let sessionDeletions = 0;
let jobToDelete = null;
let currentPostingMode = "detailed";

// ===============================
// 🔌 Initialize Supabase
// ===============================
let supabase = null;
let isSupabaseConnected = false;

try {
  supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
  isSupabaseConnected = true;
  console.log("✅ Supabase connected");
} catch (error) {
  console.warn("⚠️ Supabase connection failed:", error.message);
}

// ===============================
// 🗂 Demo Jobs (Fallback)
// ===============================
let demoJobs = [
  {
    id: 1,
    position: "Software Engineer",
    company: "Tech Qatar",
    description: "Looking for React developer with 3+ years exp.",
    salary: "QR 8000/month",
    category: "IT",
    location: "Doha",
    contact: "hr@techqatar.com",
    created_at: new Date().toISOString(),
    poster_url: null,
    is_image_only: false,
  },
  {
    id: 2,
    position: "Delivery Driver",
    company: "Quick Delivery",
    description: "Driver with Qatar license. Flexible hours.",
    salary: "QR 3500/month + tips",
    category: "Delivery",
    location: "Al Rayyan",
    contact: null,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    poster_url: null,
    is_image_only: false,
  },
];

// ===============================
// 📌 DOM Ready
// ===============================
document.addEventListener("DOMContentLoaded", function () {
  const modal = document.getElementById("jobModal");
  const openModal = document.getElementById("openModal");
  const openQuickModal = document.getElementById("openQuickModal");
  const closeModal = document.getElementById("closeModal");
  const submitJob = document.getElementById("submitJob");
  const search = document.getElementById("search");
  const categoryFilter = document.getElementById("categoryFilter");
  const demoNotice = document.getElementById("demoNotice");
  const detailedModeBtn = document.getElementById("detailedModeBtn");
  const quickModeBtn = document.getElementById("quickModeBtn");
  const quickUploadZone = document.getElementById("quickUploadZone");
  const quickPoster = document.getElementById("quickPoster");

  if (!isSupabaseConnected) demoNotice.style.display = "block";

  // Form & Modal Events
  openModal.onclick = () => {
    switchPostingMode("detailed");
    openJobModal();
  };
  openQuickModal.onclick = () => {
    switchPostingMode("quick");
    openJobModal();
  };
  closeModal.onclick = () => closeJobModal();
  window.onclick = (e) => {
    if (e.target == modal) closeJobModal();
  };
  submitJob.onclick = () => addJob();

  // Delete Confirmation
  document.getElementById("confirmDelete").onclick = () => confirmDeletion();
  document.getElementById("cancelDelete").onclick = () => cancelDelete();

  // Poster Input
  document.getElementById("poster").onchange = function () {
    const fileName = this.files[0]
      ? this.files[0].name
      : "Click to upload job poster (optional)";
    document.querySelector(".file-input").textContent = "📁 " + fileName;
  };

  // Mode Switch
  detailedModeBtn.onclick = () => switchPostingMode("detailed");
  quickModeBtn.onclick = () => switchPostingMode("quick");

  // Quick Upload
  quickUploadZone.onclick = () => quickPoster.click();
  quickPoster.onchange = function () {
    if (this.files[0]) handleQuickImageUpload(this.files[0]);
  };

  // Search / Filter
  search.oninput = () => debounce(loadJobs, 300)();
  categoryFilter.onchange = () => loadJobs();

  // Init
  loadJobs();
  if (isSupabaseConnected) setInterval(loadJobs, 5 * 60 * 1000);
});

// ===============================
// 🛡️ Admin Mode
// ===============================
document.addEventListener("keydown", function (e) {
  if (e.ctrlKey && e.shiftKey && e.key === "M") {
    e.preventDefault();
    toggleAdminMode();
  }
  if (e.key === "Escape") {
    closeJobModal();
    cancelDelete();
  }
});

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
  document.body.classList.add("admin-mode");
  const adminPanel = document.getElementById("adminPanel");
  if (adminPanel) adminPanel.classList.add("active");
  updateAdminStats();
}

function deactivateAdminMode() {
  isAdminMode = false;
  document.body.classList.remove("admin-mode");
  const adminPanel = document.getElementById("adminPanel");
  if (adminPanel) adminPanel.classList.remove("active");
}

function updateAdminStats() {
  if (isAdminMode) {
    const totalJobs = document.querySelectorAll(".job-card").length;
    document.getElementById("totalJobs").textContent = totalJobs;
    document.getElementById("sessionDeletions").textContent =
      sessionDeletions;
  }
}

// ===============================
// 🗑️ Job Deletion
// ===============================
function initiateDelete(jobId, position, company) {
  if (!isAdminMode) return;
  jobToDelete = jobId;
  document.getElementById("jobDetails").innerHTML =
    `<strong>ID:</strong> ${jobId}<br><strong>Position:</strong> ${position}<br><strong>Company:</strong> ${company}`;
  document.getElementById("deletePasscode").value = "";
  document.getElementById("confirmModal").style.display = "flex";
}

async function confirmDeletion() {
  const deletePasscode = document.getElementById("deletePasscode");
  if (deletePasscode.value !== ADMIN_PASSCODE) {
    alert("❌ Incorrect passcode!");
    return;
  }
  if (!jobToDelete) return;

  const confirmBtn = document.getElementById("confirmDelete");
  confirmBtn.textContent = "🔄 Deleting...";
  confirmBtn.disabled = true;

  try {
    let deleteSuccess = false;
    if (isSupabaseConnected) {
      const { error } = await supabase
        .from("jobs")
        .delete()
        .eq("id", jobToDelete);
      if (!error) deleteSuccess = true;
    } else {
      demoJobs = demoJobs.filter((job) => job.id !== jobToDelete);
      deleteSuccess = true;
    }

    if (deleteSuccess) {
      sessionDeletions++;
      cancelDelete();
      showDeletionSuccess();
      loadJobs();
    }
  } catch (err) {
    alert("❌ Error deleting job: " + err.message);
  } finally {
    confirmBtn.textContent = "🗑️ Delete";
    confirmBtn.disabled = false;
  }
}

function cancelDelete() {
  document.getElementById("confirmModal").style.display = "none";
  jobToDelete = null;
}

function showDeletionSuccess() {
  const div = document.createElement("div");
  div.style.cssText =
    "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#28a745;color:#fff;padding:15px 25px;border-radius:10px;z-index:3001;font-weight:bold;";
  div.textContent = "✅ Job deleted successfully!";
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 2000);
}

// ===============================
// 📄 Job Posting
// ===============================
async function addJob() {
  if (currentPostingMode === "detailed") await addDetailedJob();
  else await addQuickJob();
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
    showError("Fill in all required fields (*)");
    return;
  }

  if (contact && !isValidEmail(contact)) {
    showError("Enter a valid email");
    return;
  }

  await processJobSubmission(
    {
      position,
      description,
      salary: salary || null,
      company,
      location: location || null,
      category,
      contact: contact || null,
      is_image_only: false,
    },
    poster
  );
}

async function addQuickJob() {
  const quickPoster = document.getElementById("quickPoster").files[0];
  const title = document.getElementById("quickTitle").value.trim();
  const company = document.getElementById("quickCompany").value.trim();
  const category = document.getElementById("quickCategory").value;

  if (!quickPoster) {
    showError("Upload a job poster image");
    return;
  }

  await processJobSubmission(
    {
      position: title || "Job Opportunity",
      description: "See image for full details",
      salary: null,
      company: company || "Company",
      location: null,
      category: category || "Others",
      contact: null,
      is_image_only: true,
    },
    quickPoster
  );
}

async function processJobSubmission(jobData, poster) {
  const submitJob = document.getElementById("submitJob");
  submitJob.disabled = true;
  submitJob.textContent = "🔄 Posting...";
  hideMessages();

  try {
    let poster_url = null;
    if (poster) poster_url = URL.createObjectURL(poster);

    const newJob = {
      ...jobData,
      poster_url,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConnected) {
      await supabase.from("jobs").insert([newJob]);
    } else {
      newJob.id =
        Math.max(0, ...demoJobs.map((j) => j.id)) + 1;
      demoJobs.unshift(newJob);
    }

    showSuccess("Job posted successfully! 🎉");
    setTimeout(() => {
      closeJobModal();
      loadJobs();
    }, 2000);
  } catch (err) {
    showError("Failed to post job: " + err.message);
  } finally {
    submitJob.disabled = false;
    submitJob.textContent = "🚀 Post Job";
  }
}

// ===============================
// 📋 Utility Functions
// ===============================
async function loadJobs() {
  const jobsList = document.getElementById("jobsList");
  jobsList.innerHTML = "⏳ Loading jobs...";

  let jobs = [];
  if (isSupabaseConnected) {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false });
    jobs = error ? demoJobs : data;
  } else {
    jobs = demoJobs;
  }

  renderJobs(jobs);
  updateAdminStats();
}

function renderJobs(jobs) {
  const jobsList = document.getElementById("jobsList");
  jobsList.innerHTML = "";
  jobs.forEach((job) => {
    const div = document.createElement("div");
    div.className = "job-card";
    div.innerHTML = `
      <div class="job-id ${isAdminMode ? "admin-visible" : ""}">ID: ${
      job.id
    }</div>
      <h3>${job.position} - ${job.company}</h3>
      <p>${job.description}</p>
      <div class="job-meta">
        <div>🏷️ ${job.category}</div>
        ${job.salary ? `<div>💰 ${job.salary}</div>` : ""}
        ${job.location ? `<div>📍 ${job.location}</div>` : ""}
        ${job.contact ? `<div>📧 ${job.contact}</div>` : ""}
      </div>
      ${
        job.poster_url
          ? `<img src="${job.poster_url}" class="job-poster">`
          : ""
      }
      <button onclick="shareJob('${job.position}','${job.company}','${job.description}')">📤 Share</button>
      <button class="delete-btn ${
        isAdminMode ? "admin-visible" : ""
      }" onclick="initiateDelete(${job.id},'${job.position}','${job.company}')">🗑️ Delete</button>
    `;
    jobsList.appendChild(div);
  });
}

function showSuccess(msg) {
  const el = document.getElementById("successMsg");
  el.textContent = msg;
  el.style.display = "block";
}

function showError(msg) {
  const el = document.getElementById("errorMsg");
  el.textContent = msg;
  el.style.display = "block";
}

function hideMessages() {
  document.getElementById("successMsg").style.display = "none";
  document.getElementById("errorMsg").style.display = "none";
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

function openJobModal() {
  document.getElementById("jobModal").style.display = "flex";
}

function closeJobModal() {
  document.getElementById("jobModal").style.display = "none";
}

// ===============================
// 📤 Share Job
// ===============================
function shareJob(position, company, description) {
  const text = `🔹 ${position} at ${company}\n📋 ${description}\n🌐 Find more jobs at: https://halajobsqa.com`;

  if (navigator.share) {
    navigator.share({ title: position, text }).catch(() => {});
  } else {
    navigator.clipboard.writeText(text).then(() =>
      alert("✅ Job copied! Share anywhere.")
    );
  }
}
