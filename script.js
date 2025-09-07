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
