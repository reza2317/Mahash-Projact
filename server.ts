import express from 'express';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure public uploads directory exists
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  try {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  } catch (err) {
    console.warn('Could not create uploads directory:', err);
  }
}

// Serve uploaded files statically
app.use('/uploads', express.static(UPLOADS_DIR));

// ----------------------------------------------------
// Persistent Server Data Store (Persists across all domains & restarts)
// ----------------------------------------------------
const DATA_STORE_FILE = path.join(process.cwd(), 'data_store.json');

interface ServerStoreData {
  teamLogos: Record<string, string>;
  teamOverrides: Record<string, any>;
  mahashLogo?: string | null;
  clubEmblem?: string | null;
  customReports: any[];
  deletedReports: string[];
  scores: any[];
  events: any[];
  customBadges: any[];
  reportViews: Record<string, number>;
  updatedAt?: string;
}

let inMemoryStore: ServerStoreData = {
  teamLogos: {},
  teamOverrides: {},
  mahashLogo: null,
  clubEmblem: null,
  customReports: [],
  deletedReports: [],
  scores: [],
  events: [],
  customBadges: [],
  reportViews: {},
  updatedAt: new Date().toISOString()
};

// Load initial store from disk if exists
try {
  if (fs.existsSync(DATA_STORE_FILE)) {
    const raw = fs.readFileSync(DATA_STORE_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      inMemoryStore = {
        ...inMemoryStore,
        ...parsed,
        teamLogos: parsed.teamLogos || {},
        teamOverrides: parsed.teamOverrides || {},
        customReports: Array.isArray(parsed.customReports) ? parsed.customReports : [],
        deletedReports: Array.isArray(parsed.deletedReports) ? parsed.deletedReports : [],
        scores: Array.isArray(parsed.scores) ? parsed.scores : [],
        events: Array.isArray(parsed.events) ? parsed.events : [],
        customBadges: Array.isArray(parsed.customBadges) ? parsed.customBadges : [],
        reportViews: parsed.reportViews || {}
      };
      console.log('✅ Loaded persistent server store from disk.');
    }
  }
} catch (err) {
  console.warn('⚠️ Could not load data_store.json, starting with fresh memory store:', err);
}

function saveStoreToDisk() {
  try {
    fs.writeFileSync(DATA_STORE_FILE, JSON.stringify(inMemoryStore, null, 2), 'utf-8');
  } catch (err) {
    console.warn('⚠️ Could not write data_store.json to disk:', err);
  }
}

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Shared Server Store GET endpoint
app.get('/api/store', (req, res) => {
  res.json(inMemoryStore);
});

// Shared Server Store POST/Sync endpoint
app.post('/api/store', (req, res) => {
  try {
    const payload = req.body || {};
    
    // Merge team logos
    if (payload.teamLogos && typeof payload.teamLogos === 'object') {
      inMemoryStore.teamLogos = {
        ...inMemoryStore.teamLogos,
        ...payload.teamLogos
      };
    }

    // Merge team overrides
    if (payload.teamOverrides && typeof payload.teamOverrides === 'object') {
      inMemoryStore.teamOverrides = {
        ...inMemoryStore.teamOverrides,
        ...payload.teamOverrides
      };
    }

    // Update logos & emblems if supplied
    if (payload.mahashLogo !== undefined) {
      inMemoryStore.mahashLogo = payload.mahashLogo;
    }
    if (payload.clubEmblem !== undefined) {
      inMemoryStore.clubEmblem = payload.clubEmblem;
    }

    // Update custom reports
    if (Array.isArray(payload.customReports)) {
      inMemoryStore.customReports = payload.customReports;
    }

    // Update deleted reports
    if (Array.isArray(payload.deletedReports)) {
      inMemoryStore.deletedReports = payload.deletedReports;
    }

    // Update scores
    if (Array.isArray(payload.scores)) {
      inMemoryStore.scores = payload.scores;
    }

    // Update events
    if (Array.isArray(payload.events)) {
      inMemoryStore.events = payload.events;
    }

    // Update custom badges
    if (Array.isArray(payload.customBadges)) {
      inMemoryStore.customBadges = payload.customBadges;
    }

    // Update report views
    if (payload.reportViews && typeof payload.reportViews === 'object') {
      inMemoryStore.reportViews = {
        ...inMemoryStore.reportViews,
        ...payload.reportViews
      };
    }

    inMemoryStore.updatedAt = new Date().toISOString();
    saveStoreToDisk();

    res.json({ success: true, store: inMemoryStore });
  } catch (err: any) {
    console.error('Error updating store:', err);
    res.status(500).json({ error: 'Failed to update server store', details: err?.message });
  }
});

// Reset Server Store endpoint
app.post('/api/store/reset', (req, res) => {
  inMemoryStore = {
    teamLogos: {},
    teamOverrides: {},
    mahashLogo: null,
    clubEmblem: null,
    customReports: [],
    deletedReports: [],
    scores: [],
    events: [],
    customBadges: [],
    reportViews: {},
    updatedAt: new Date().toISOString()
  };
  saveStoreToDisk();
  res.json({ success: true, message: 'Server store reset to defaults.' });
});

// Upload image/logo/asset endpoint
app.post('/api/upload', (req, res) => {
  try {
    const { filename, base64Data, contentType } = req.body || {};
    if (!base64Data || typeof base64Data !== 'string') {
      res.status(400).json({ error: 'base64Data is required.' });
      return;
    }

    // Extract raw base64 data and extension
    let cleanBase64 = base64Data;
    let ext = '.png';
    if (base64Data.startsWith('data:')) {
      const parts = base64Data.split(';base64,');
      cleanBase64 = parts[1] || '';
      const mime = parts[0].replace('data:', '');
      if (mime.includes('jpeg') || mime.includes('jpg')) ext = '.jpg';
      else if (mime.includes('webp')) ext = '.webp';
      else if (mime.includes('svg')) ext = '.svg';
      else if (mime.includes('pdf')) ext = '.pdf';
      else if (mime.includes('mp4')) ext = '.mp4';
    }

    const safeName = (filename || `upload-${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '_');
    const targetFileName = `${safeName}-${Date.now()}${ext}`;
    const targetFilePath = path.join(UPLOADS_DIR, targetFileName);

    fs.writeFileSync(targetFilePath, Buffer.from(cleanBase64, 'base64'));

    const publicUrl = `/uploads/${targetFileName}`;
    res.json({ success: true, url: publicUrl, filename: targetFileName });
  } catch (err: any) {
    console.error('Upload Error:', err);
    res.status(500).json({ error: 'Failed to save file on server', details: err?.message });
  }
});

// Lazy-initialized Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

// API endpoint for AI report suggestions and tone improvements
app.post('/api/gemini/suggest-improvements', async (req, res) => {
  try {
    const { reportText, teamName, tone, mode, customPrompt } = req.body || {};

    if (!reportText || typeof reportText !== 'string') {
      res.status(400).json({ error: 'متن گزارش برای بررسی الزامی است.' });
      return;
    }

    const ai = getGeminiClient();

    if (!ai) {
      // High-quality smart fallback when GEMINI_API_KEY is not configured
      const fallbackSuggestion = generateSmartFallbackSuggestion(reportText, teamName, tone, mode);
      res.json({ suggestion: fallbackSuggestion, isFallback: true });
      return;
    }

    const systemInstruction = `شما دستیار ارشد هوش مصنوعی و ویراستار زبان فارسی در مؤسسه و باشگاه جوانان ناشنوایان و کم‌شنوایان «محاش» هستید.
وظیفه شما ارتقا، بازنویسی، روان‌سازی، تنظیم لحن و غنی‌سازی متون گزارش‌ها و فعالیت‌های تیم‌های پنج‌گانه است.
اصول کلیدی:
۱. زبان فارسی معیار، شیوا، امیدبخش و شفاف.
۲. جملات روان و رسا، مناسب خوانش روان و افراد دارای افت شنوایی.
۳. تفکیک ساختار یافته با عناوین جذاب و نکات کلیدی بولت‌شده.
۴. رعایت شأن و اصالت کار گروهی و دستاوردهای جوانان.
۵. قالب خروجی با علامت‌گذاری مناسب مارک‌داون (Markdown).`;

    let toneDescription = 'رسمی، مستند، حرفه‌ای و امیدبخش';
    if (tone === 'motivational') toneDescription = 'انگیزشی، پرشور، صمیمانه و الهام‌بخش برای جوانان';
    if (tone === 'brief') toneDescription = 'موجز، شفاف، خبری و نکات کلیدی سریع';
    if (tone === 'educational') toneDescription = 'آموزشی، توانمندساز، روانشناختی و گام‌به‌گام';

    const userPrompt = `لطفاً متن گزارش زیر متعلق به «${teamName || 'باشگاه جوانان محاش'}» را بررسی کرده و نسخه بهبودیافته آن را ارائه فرمایید:
لحن درخواستی: ${toneDescription}
حالت ویرایش: ${mode || 'بهبود و بازنویسی جامع'}
${customPrompt ? `دستور ویژه تکمیلی: ${customPrompt}` : ''}

متن گزارش ورودی:
«${reportText}»

خروجی شامل:
۱. عنوان پیشنهادی جذاب
۲. متن بازنویسی‌شده و ویراستاری‌شده با لحن مناسب
۳. نکات کلیدی و دستاوردهای برجسته
۴. پیشنهاد دیالوگ هماهنگ برای زیرنویس ویدیو`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.7
      }
    });

    const suggestion = response.text || generateSmartFallbackSuggestion(reportText, teamName, tone, mode);
    res.json({ suggestion, isFallback: false });
  } catch (err: any) {
    console.error('Gemini API Error:', err);
    // Graceful fallback on API errors
    const fallbackSuggestion = generateSmartFallbackSuggestion(
      req.body?.reportText || '',
      req.body?.teamName,
      req.body?.tone,
      req.body?.mode
    );
    res.json({ suggestion: fallbackSuggestion, isFallback: true, error: err?.message });
  }
});

// API endpoint for AI Team History and Highlights Summary
app.post('/api/gemini/generate-summary', async (req, res) => {
  try {
    const { teamName, manager, slogan, reports } = req.body || {};
    const ai = getGeminiClient();

    const tName = teamName || 'تیم باشگاه جوانان محاش';
    const tMgr = manager || 'مدیر تیم';
    const tSlogan = slogan || 'رشد، یادگیری و هم‌افزایی';
    const reportList = Array.isArray(reports) ? reports : [];

    if (!ai) {
      const fallback = generateFallbackTeamSummary(tName, tMgr, tSlogan, reportList);
      res.json({ summary: fallback, isFallback: true });
      return;
    }

    const prompt = `شما مشاور و تحلیل‌گر ارشد مؤسسه محاش هستید.
لطفاً یک خلاصه‌جامع، الهام‌بخش و ساختاریافته از تاریخچه، رسالت و دستاوردهای تیم زیر تدوین نمایید:
نام تیم: ${tName}
مدیر تیم: ${tMgr}
شعار تیمی: «${tSlogan}»
تعداد گزارش‌های ثبت‌شده: ${reportList.length}
فهرست عناوین گزارش‌ها: ${reportList.map((r: any) => `«${r.title || r}»`).join('، ')}

ساختار خروجی:
📌 **شناسنامه و مأموریت راهبردی تیم**
👥 **مدیریت، سرمایه انسانی و مشارکت اعضا**
🏆 **مهم‌ترین دستاوردها و خروجی‌های کارگاه‌ها**
🌟 **چشم‌انداز آینده و برنامه‌های پیش‌رو**`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'متن را به فارسی شیوا، رسمی و امیدبخش با قالب مارک‌داون ارائه دهید.',
        temperature: 0.6
      }
    });

    const summary = response.text || generateFallbackTeamSummary(tName, tMgr, tSlogan, reportList);
    res.json({ summary, isFallback: false });
  } catch (err: any) {
    console.error('Gemini Team Summary Error:', err);
    res.json({
      summary: generateFallbackTeamSummary(req.body?.teamName, req.body?.manager, req.body?.slogan, req.body?.reports),
      isFallback: true
    });
  }
});

function generateSmartFallbackSuggestion(
  text: string,
  teamName = 'باشگاه جوانان محاش',
  tone = 'official',
  mode = 'polish'
): string {
  const clean = text.trim();
  return `📝 **نسخه پیشنهادی بهبود متن گزارش:**

📌 **عنوان بهینه‌سازی‌شده:** «گزارش جامع اقدامات و دستاوردهای کارگروه ${teamName}»

📖 **متن بازنویسی‌شده و ویراسته:**
در امتداد برنامه‌های راهبردی و آموزشی باشگاه جوانان مؤسسه محاش، اعضای پرتلاش ${teamName} با تکیه بر هم‌افزایی گروهی و یادگیری مستمر، فعالیت مذکور را به شرح زیر با موفقیت اجرا نمودند:
${clean}

🎯 **نکات کلیدی و ارزش‌آفرین:**
• ارتقای مهارت‌های فردی و تیمی در بستری کاملاً مناسب‌سازی‌شده برای ناشنوایان و کم‌شنوایان.
• ثبت دقیق تجربیات و مستندسازی گام‌به‌گام مراحل اجرایی.
• ایجاد انگیزه و گسترش تعاملات اجتماعی مؤثر میان اعضای باشگاه.

🎬 **پیشنهاد دیالوگ زیرنویس هماهنگ ویدیو:**
«سلام و درود به همراهان گرامی محاش. در این گزارش رسمی، دستاوردها و خلاصه اقدامات ${teamName} تقدیم نگاه پرمهر شما می‌شود.»`;
}

function generateFallbackTeamSummary(
  teamName = 'تیم باشگاه جوانان',
  manager = 'مدیریت تیم',
  slogan = 'تلاش و پشتکار',
  reports: any[] = []
): string {
  const count = reports.length;
  return `📌 **شناسنامه و رسالت بنیادین:**
تیم **${teamName}** یکی از کارگروه‌های ممتاز و پویای باشگاه جوانان مؤسسه محاش به مدیریت **${manager}** است که با شعار محوری *«${slogan}»* در مسیر تعالی، توانمندسازی و کارآفرینی جوانان دارای افت شنوایی گام برمی‌دارد.

👥 **سرمایه انسانی و فرهنگ تیمی:**
این کارگروه با بهره‌گیری از انگیزه بالا، تعهد اعضای فعال و رویکرد کارگروهی، بستری سرشار از اعتمادبه‌نفس، یادگیری متقابل و امید را خلق نموده است.

🏆 **دستاوردهای ثبت‌شده:**
تاکنون تعداد **${count} گزارش رسمی** و مستندات ویدیویی توسط این تیم تدوین و در سامانه منتشر شده است که نشان‌دهنده استمرار و پویایی اعضا می‌باشد.

🌟 **چشم‌انداز آتی:**
تیم ${teamName} آماده برداشتن گام‌های نوین در راستای پیاده‌سازی طرح‌های ابتکاری و اشتراک تجارب با سایر تیم‌های باشگاه محاش است.`;
}

// Vite middleware integration
async function startApp() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Mahash Portal server running on port ${PORT}`);
  });
}

startApp();
