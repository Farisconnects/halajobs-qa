// HALAJOBS.QA - LinkedIn-Style Social Platform Script
console.log('🇶🇦 HALAJOBS.QA - Enhanced Version with Link Preview...');

// Configuration
const supabaseUrl = "https://ehoctsjvtfuesqeonlco.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVob2N0c2p2dGZ1ZXNxZW9ubGNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5OTU2ODcsImV4cCI6MjA3MjU3MTY4N30.kGz2t58YXWTwOB_h40dH0GOBLF12FQxKsZnqQ983Xro";
const LINK_PREVIEW_API_KEY = "9d8c472736a234ef61a6df94ead940be"; // ✅ Added

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
const ADS_FREQUENCY = 2; 

// Anonymous like storage
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

// Initialize Supabase
function initializeSupabase() {
    try {
        if (window.supabase && supabaseUrl && supabaseKey) {
            supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
            isSupabaseConnected = true;
            console.log("✅ Supabase connected successfully!");
        } else throw new Error("Supabase not available");
    } catch (error) {
        console.warn("⚠️ Supabase connection failed:", error.message);
        isSupabaseConnected = false;
    }
}

// Load likes
function loadLikedJobs() {
    try {
        const stored = localStorage.getItem('halajobs_liked');
        if (stored) likedJobs = new Set(JSON.parse(stored));
    } catch {
        likedJobs = new Set();
    }
}

function saveLikedJobs() {
    localStorage.setItem('halajobs_liked', JSON.stringify([...likedJobs]));
}

// Initialization
document.addEventListener('DOMContentLoaded', function() {
    console.log('🇶🇦 HALAJOBS.QA Loading...');
    initializeSupabase();
    loadLikedJobs();
    setupEventListeners();
    loadJobs();
    animateStatsOnScroll();
    setupLinkPreview(); // ✅ Added for link previews
    console.log('🚀 HALAJOBS.QA Loaded Successfully!');
});

// ---------- EXISTING JOB LOGIC OMITTED FOR SPACE ---------- //
// (You don’t need to remove or change anything from your existing code above this line)

// ✅ Add link preview system
function setupLinkPreview() {
    const jobUrlInput = document.getElementById('jobUrl');
    const urlPreviewContainer = document.getElementById('urlPreviewContainer');
    const urlPreviewContent = document.getElementById('urlPreviewContent');
    const urlPreviewLoading = document.getElementById('urlPreviewLoading');
    const removeBtn = document.getElementById('removeUrlPreview');

    if (!jobUrlInput) return;

    jobUrlInput.addEventListener('input', async (e) => {
        const url = e.target.value.trim();

        if (url && url.startsWith('http')) {
            urlPreviewContainer.style.display = 'block';
            urlPreviewLoading.style.display = 'flex';
            urlPreviewContent.style.display = 'none';

            const preview = await fetchLinkPreview(url);

            urlPreviewLoading.style.display = 'none';

            if (preview) {
                urlPreviewContent.innerHTML = `
                    <div class="preview-wrapper">
                      <img src="${preview.image || '/default-job.png'}" alt="Preview" class="preview-image">
                      <div class="preview-text">
                        <h4>${preview.title || 'Job Link'}</h4>
                        <p>${preview.description || ''}</p>
                        <a href="${preview.url}" target="_blank" class="preview-link">View Job →</a>
                      </div>
                    </div>
                `;
                urlPreviewContent.style.display = 'block';
            } else {
                urlPreviewContent.innerHTML = `<p style="color:#888;">No preview available</p>`;
                urlPreviewContent.style.display = 'block';
            }
        } else {
            urlPreviewContainer.style.display = 'none';
        }
    });

    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            jobUrlInput.value = '';
            urlPreviewContainer.style.display = 'none';
        });
    }
}

// Fetch metadata from LinkPreview API
async function fetchLinkPreview(url) {
    try {
        const response = await fetch(`https://api.linkpreview.net/?key=${LINK_PREVIEW_API_KEY}&q=${encodeURIComponent(url)}`);
        if (!response.ok) throw new Error("Preview fetch failed");
        const data = await response.json();
        console.log('🔗 Link preview fetched:', data);
        return data;
    } catch (err) {
        console.warn("⚠️ Link preview failed:", err.message);
        return null;
    }
}

console.log('✅ HALAJOBS.QA - Script Ready with LinkPreview Integration!');
