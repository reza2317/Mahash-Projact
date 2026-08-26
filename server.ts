import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
