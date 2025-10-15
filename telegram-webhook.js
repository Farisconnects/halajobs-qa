// api/telegram-webhook.js - Vercel Serverless Function
// Handles Telegram bot messages and posts jobs to Supabase

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const botToken = process.env.TELEGRAM_BOT_TOKEN;

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper: Extract hashtags from text
function extractHashtags(text) {
  if (!text) return [];
  const hashtagRegex = /#[\w\u0621-\u064A]+/g;
  const matches = text.match(hashtagRegex);
  return matches ? matches.map(tag => tag.substring(1)) : [];
}

// Helper: Parse job details from message
function parseJobMessage(text, caption) {
  const content = caption || text || '';
  
  // Extract position (first line or first sentence)
  const lines = content.split('\n').filter(line => line.trim());
  const position = lines[0] || 'Job Position';
  
  // Extract company (look for patterns like "at Company" or "- Company")
  let company = 'Company';
  const companyMatch = content.match(/(?:at|@|company:?)\s+([^\n]+)/i);
  if (companyMatch) {
    company = companyMatch[1].trim();
  } else if (lines.length > 1) {
    company = lines[1].trim();
  }
  
  // Extract salary
  let salary = null;
  const salaryMatch = content.match(/(?:salary|qr|ريال)[\s:]*(\d{1,3}(?:,\d{3})*(?:\+)?)/i);
  if (salaryMatch) {
    salary = salaryMatch[0].replace(/salary[\s:]*/i, '').trim();
  }
  
  // Extract location
  let location = null;
  const locationMatch = content.match(/(?:location|📍|doha|al\s+rayyan|west\s+bay|lusail)[\s:]*([^\n]+)/i);
  if (locationMatch) {
    location = locationMatch[1].trim();
  }
  
  // Detect category from content
  let category = 'Others';
  const contentLower = content.toLowerCase();
  
  if (contentLower.includes('software') || contentLower.includes('developer') || contentLower.includes('programmer') || contentLower.includes('it ')) {
    category = 'IT';
  } else if (contentLower.includes('engineer')) {
    category = 'Engineer';
  } else if (contentLower.includes('driver')) {
    category = 'Driver';
  } else if (contentLower.includes('sales') || contentLower.includes('marketing')) {
    category = 'Sales';
  } else if (contentLower.includes('nurse') || contentLower.includes('doctor') || contentLower.includes('medical')) {
    category = 'Healthcare';
  } else if (contentLower.includes('accountant') || contentLower.includes('finance')) {
    category = 'Accountant';
  } else if (contentLower.includes('delivery')) {
    category = 'Delivery';
  } else if (contentLower.includes('construction') || contentLower.includes('building')) {
    category = 'Construction';
  } else if (contentLower.includes('technician') || contentLower.includes('mechanic')) {
    category = 'Technician';
  } else if (contentLower.includes('helper') || contentLower.includes('cleaner')) {
    category = 'Helper';
  }
  
  return {
    position: position.replace(/[#@]/g, '').trim().substring(0, 200),
    company: company.replace(/[#@]/g, '').trim().substring(0, 200),
    description: content.trim(),
    salary,
    location,
    category
  };
}

// Helper: Download image from Telegram
async function downloadTelegramImage(fileId) {
  try {
    // Get file path
    const fileResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`
    );
    const fileData = await fileResponse.json();
    
    if (!fileData.ok) {
      throw new Error('Failed to get file info');
    }
    
    const filePath = fileData.result.file_path;
    
    // Download file
    const imageResponse = await fetch(
      `https://api.telegram.org/file/bot${botToken}/${filePath}`
    );
    
    if (!imageResponse.ok) {
      throw new Error('Failed to download image');
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';
    
    return `data:${mimeType};base64,${base64Image}`;
  } catch (error) {
    console.error('Error downloading image:', error);
    return null;
  }
}

// Helper: Send Telegram message
async function sendTelegramMessage(chatId, text) {
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML'
      })
    });
  } catch (error) {
    console.error('Error sending Telegram message:', error);
  }
}

// Main handler
export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const update = req.body;
    
    // Handle message
    if (update.message) {
      const message = update.message;
      const chatId = message.chat.id;
      const text = message.text;
      const caption = message.caption;
      
      // Handle /start command
      if (text === '/start') {
        await sendTelegramMessage(
          chatId,
          '👋 <b>Welcome to HALAJOBS.QA Bot!</b>\n\n' +
          '📝 <b>How to post a job:</b>\n' +
          '1. Send a job poster image with caption\n' +
          '2. Or send text with job details\n\n' +
          '<b>Example:</b>\n' +
          'Senior Software Engineer at Tech Qatar\n\n' +
          'Looking for React developers\n' +
          'Salary: QR 12,000/month\n' +
          'Location: Doha\n\n' +
          '#QatarJobs #IT #Developer\n\n' +
          '✅ Your job will be posted automatically!'
        );
        return res.status(200).json({ ok: true, message: 'Start command sent' });
      }
      
      // Handle image with caption
      if (message.photo && message.photo.length > 0) {
        const photo = message.photo[message.photo.length - 1]; // Get largest photo
        const imageUrl = await downloadTelegramImage(photo.file_id);
        
        if (!imageUrl) {
          await sendTelegramMessage(chatId, '❌ Failed to download image. Please try again.');
          return res.status(200).json({ ok: false, error: 'Image download failed' });
        }
        
        const jobDetails = parseJobMessage(null, caption);
        const hashtags = extractHashtags(caption || '');
        
        const jobData = {
          ...jobDetails,
          hashtags,
          poster_url: imageUrl,
          likes: 0,
          created_at: new Date().toISOString()
        };
        
        // Insert into Supabase
        const { data, error } = await supabase
          .from('jobs')
          .insert([jobData])
          .select()
          .single();
        
        if (error) {
          console.error('Supabase insert error:', error);
          await sendTelegramMessage(
            chatId,
            '❌ Failed to post job to database. Please try again.'
          );
          return res.status(200).json({ ok: false, error: error.message });
        }
        
        await sendTelegramMessage(
          chatId,
          `✅ <b>Job Posted Successfully!</b>\n\n` +
          `📋 Position: ${jobDetails.position}\n` +
          `🏢 Company: ${jobDetails.company}\n` +
          `📂 Category: ${jobDetails.category}\n\n` +
          `🌐 View at: https://halajobsqa.com/`
        );
        
        return res.status(200).json({ ok: true, job: data });
      }
      
      // Handle text message
      if (text && text !== '/start') {
        const jobDetails = parseJobMessage(text, null);
        const hashtags = extractHashtags(text);
        
        const jobData = {
          ...jobDetails,
          hashtags,
          poster_url: null,
          likes: 0,
          created_at: new Date().toISOString()
        };
        
        // Insert into Supabase
        const { data, error } = await supabase
          .from('jobs')
          .insert([jobData])
          .select()
          .single();
        
        if (error) {
          console.error('Supabase insert error:', error);
          await sendTelegramMessage(
            chatId,
            '❌ Failed to post job. Please try again.'
          );
          return res.status(200).json({ ok: false, error: error.message });
        }
        
        await sendTelegramMessage(
          chatId,
          `✅ <b>Job Posted Successfully!</b>\n\n` +
          `📋 Position: ${jobDetails.position}\n` +
          `🏢 Company: ${jobDetails.company}\n` +
          `📂 Category: ${jobDetails.category}\n` +
          `${jobDetails.salary ? `💰 Salary: ${jobDetails.salary}\n` : ''}` +
          `${jobDetails.location ? `📍 Location: ${jobDetails.location}\n` : ''}\n` +
          `🌐 View at: https://halajobsqa.com/`
        );
        
        return res.status(200).json({ ok: true, job: data });
      }
    }
    
    return res.status(200).json({ ok: true, message: 'Update received' });
    
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(200).json({ ok: false, error: error.message });
  }
}
