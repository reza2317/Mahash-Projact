import { TranscriptScene, ActivityReport } from '../types';

/**
 * Format raw seconds to standard WebVTT timestamp: HH:MM:SS.mmm
 */
export function formatVttTimestamp(seconds: number): string {
  const totalMs = Math.max(0, Math.round(seconds * 1000));
  const hrs = Math.floor(totalMs / 3600000);
  const mins = Math.floor((totalMs % 3600000) / 60000);
  const secs = Math.floor((totalMs % 60000) / 1000);
  const ms = totalMs % 1000;
  const pad2 = (n: number) => (n < 10 ? '0' + n : String(n));
  const pad3 = (n: number) => (n < 10 ? '00' + n : n < 100 ? '0' + n : String(n));
  return `${pad2(hrs)}:${pad2(mins)}:${pad2(secs)}.${pad3(ms)}`;
}

/**
 * Generate standard WebVTT string from transcript scenes
 */
export function generateWebVttFromScenes(
  scenes: TranscriptScene[],
  title: string = 'گزارش فعالیت'
): string {
  let vtt = `WEBVTT - سامانه دسترس‌پذیری ناشنوایان و کم‌شنوایان مؤسسه محاش (هوش مصنوعی Gemini)\nNOTE عنوان گزارش: ${title}\n\n`;
  
  scenes.forEach((scene, index) => {
    const startSec = typeof scene.seconds === 'number' ? scene.seconds : index * 5;
    const endSec = typeof scene.endSeconds === 'number' ? scene.endSeconds : startSec + 5;
    const startTs = formatVttTimestamp(startSec);
    const endTs = formatVttTimestamp(endSec);
    const speakerPrefix = scene.speaker ? `<v ${scene.speaker}>` : '';
    const speakerSuffix = scene.speaker ? `</v>` : '';
    
    vtt += `${index + 1}\n`;
    vtt += `${startTs} --> ${endTs}\n`;
    vtt += `${speakerPrefix}${scene.text}${speakerSuffix}\n\n`;
  });

  return vtt;
}

/**
 * Create a Blob URL from VTT string for native HTML5 <track> elements
 */
export function createVttBlobUrl(vttContent: string): string {
  try {
    const blob = new Blob([vttContent], { type: 'text/vtt;charset=utf-8' });
    return URL.createObjectURL(blob);
  } catch (e) {
    console.warn('Failed creating VTT blob URL:', e);
    return '';
  }
}

/**
 * Download VTT subtitle file to client machine
 */
export function downloadVttFile(filename: string, vttContent: string): void {
  try {
    const blob = new Blob([vttContent], { type: 'text/vtt;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.vtt') ? filename : `${filename}.vtt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  } catch (err) {
    console.error('Error downloading VTT file:', err);
  }
}

export interface SubtitleGenerationResult {
  success: boolean;
  scenes: TranscriptScene[];
  vttContent: string;
  vttUrl?: string;
  blobUrl?: string;
  isFallback: boolean;
  source?: string;
}

/**
 * Call Gemini AI Subtitle Generation service
 */
export async function generateGeminiSubtitles(
  report: ActivityReport,
  teamName: string,
  durationSeconds: number = 25,
  audioBase64?: string
): Promise<SubtitleGenerationResult> {
  try {
    const payload = {
      reportId: report.id,
      reportTitle: report.title,
      reportSummary: report.summary || '',
      teamName,
      reportText: report.title,
      durationSeconds: Math.max(10, Math.round(durationSeconds || 25)),
      audioBase64: audioBase64 || undefined
    };

    const res = await fetch('/api/gemini/generate-subtitles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    const data = await res.json();
    if (data.success && Array.isArray(data.scenes) && data.scenes.length > 0) {
      const vttContent = data.vttContent || generateWebVttFromScenes(data.scenes, report.title);
      const blobUrl = createVttBlobUrl(vttContent);
      return {
        success: true,
        scenes: data.scenes,
        vttContent,
        vttUrl: data.vttUrl || undefined,
        blobUrl,
        isFallback: Boolean(data.isFallback),
        source: data.source
      };
    }
  } catch (err) {
    console.warn('Gemini subtitle service request failed, generating smart local accessible VTT:', err);
  }

  // Graceful local fallback
  const dur = Math.max(12, Math.round(durationSeconds || 25));
  const fallbackScenes: TranscriptScene[] = [
    {
      seconds: 0,
      endSeconds: 6,
      time: '00:00',
      speaker: 'گوینده',
      role: 'معرفی',
      text: `سلام و درود به همراهان گرامی مؤسسه محاش. گزارش رسمی «${report.title}» تقدیم شما می‌شود.`
    },
    {
      seconds: 6,
      endSeconds: 14,
      time: '00:06',
      speaker: teamName,
      role: 'فعالیت',
      text: report.summary || 'برگزاری نشست راهبردی و مرور دستاوردهای تیمی اعضای توانمند باشگاه.'
    },
    {
      seconds: 14,
      endSeconds: dur,
      time: '00:14',
      speaker: 'باشگاه محاش',
      role: 'جمع‌بندی',
      text: 'رشد، خودباوری و مهارت‌آموزی جوانان دارای افت شنوایی در کنار یکدیگر.'
    }
  ];

  const vttContent = generateWebVttFromScenes(fallbackScenes, report.title);
  const blobUrl = createVttBlobUrl(vttContent);

  return {
    success: true,
    scenes: fallbackScenes,
    vttContent,
    blobUrl,
    isFallback: true,
    source: 'local-accessible-engine'
  };
}
