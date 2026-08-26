import React, { useState, useRef } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  RotateCcw,
  Eye,
  Edit3,
  Sparkles,
  AlignRight
} from 'lucide-react';
import { toPersianDigits } from '../../utils/persianDate';

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  minHeight?: string;
  label?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'متن گزارش را اینجا وارد نمایید...',
  minHeight = '140px',
  label
}) => {
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Helper to wrap selected text with markdown/formatting tags
  const applyFormat = (prefix: string, suffix: string = prefix, defaultPlaceholder: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = textarea.value;

    const selectedText = currentVal.substring(start, end) || defaultPlaceholder;
    const replacement = `${prefix}${selectedText}${suffix}`;

    const newVal = currentVal.substring(0, start) + replacement + currentVal.substring(end);
    onChange(newVal);

    // Reset cursor position inside or after inserted format
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + prefix.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Helper to apply line prefix (e.g. lists, headers, quotes)
  const applyLinePrefix = (linePrefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = textarea.value;

    // Find start of current line
    const prevNewline = currentVal.lastIndexOf('\n', start - 1);
    const lineStart = prevNewline === -1 ? 0 : prevNewline + 1;

    // Insert prefix at line start
    const newVal = currentVal.substring(0, lineStart) + linePrefix + currentVal.substring(lineStart);
    onChange(newVal);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + linePrefix.length, end + linePrefix.length);
    }, 0);
  };

  const handleClearFormat = () => {
    // Strip simple markdown tokens
    const cleaned = value
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/__(.*?)__/g, '$1')
      .replace(/~~(.*?)~~/g, '$1')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/^>\s+/gm, '')
      .replace(/^[•\-\*]\s+/gm, '')
      .replace(/^\d+\.\s+/gm, '');
    onChange(cleaned);
  };

  // Render markdown-like text to nice HTML elements for preview
  const renderFormattedPreview = (raw: string) => {
    if (!raw.trim()) {
      return (
        <p className="text-xs text-slate-400 italic py-4 text-center">
          متنی برای پیش‌نمایش وجود ندارد. در تب «ویرایش»، متن خود را وارد کنید.
        </p>
      );
    }

    const lines = raw.split('\n');
    return (
      <div className="space-y-2 text-xs leading-relaxed text-slate-800 dark:text-slate-200">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) {
            return <div key={idx} className="h-2" />;
          }

          if (trimmed.startsWith('### ')) {
            return (
              <h4 key={idx} className="text-xs font-black text-blue-700 dark:text-blue-300 pt-1 pb-0.5">
                {trimmed.replace('### ', '')}
              </h4>
            );
          }

          if (trimmed.startsWith('## ')) {
            return (
              <h3 key={idx} className="text-sm font-black text-[#173b82] dark:text-blue-400 pt-1.5 pb-0.5 border-b border-slate-100 dark:border-slate-800">
                {trimmed.replace('## ', '')}
              </h3>
            );
          }

          if (trimmed.startsWith('# ')) {
            return (
              <h2 key={idx} className="text-base font-black text-slate-900 dark:text-white pt-2 pb-1">
                {trimmed.replace('# ', '')}
              </h2>
            );
          }

          if (trimmed.startsWith('> ')) {
            return (
              <blockquote key={idx} className="border-r-4 border-blue-500 pr-3 py-1 bg-blue-50/50 dark:bg-blue-950/30 text-slate-700 dark:text-slate-300 rounded-l-lg italic text-[11px]">
                {trimmed.replace('> ', '')}
              </blockquote>
            );
          }

          if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            return (
              <div key={idx} className="flex items-start gap-2 pr-2">
                <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                <span>{trimmed.replace(/^[•\-\*]\s+/, '')}</span>
              </div>
            );
          }

          if (/^\d+\.\s+/.test(trimmed)) {
            const match = trimmed.match(/^(\d+)\.\s+(.*)/);
            return (
              <div key={idx} className="flex items-start gap-2 pr-2">
                <span className="text-amber-600 font-mono font-bold text-[11px]">{toPersianDigits(match?.[1] || '')}.</span>
                <span>{match?.[2] || ''}</span>
              </div>
            );
          }

          if (trimmed === '---') {
            return <hr key={idx} className="my-3 border-slate-200 dark:border-slate-700" />;
          }

          // Inline formatting (bold, italic)
          return (
            <p key={idx} className="whitespace-pre-wrap">
              {line}
            </p>
          );
        })}
      </div>
    );
  };

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const charCount = value.length;

  return (
    <div className="space-y-1.5 w-full text-right" dir="rtl">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            {label}
          </label>
          <span className="text-[10px] text-slate-400">
            ویرایشگر پیشرفته با قابلیت قالب‌بندی
          </span>
        </div>
      )}

      <div className="rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-xs focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition">
        {/* Toolbar Header */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 p-2 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
          {/* Format Buttons */}
          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => applyFormat('**', '**', 'متن برجسته')}
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 transition cursor-pointer"
              title="پررنگ / بولد (Ctrl+B)"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => applyFormat('*', '*', 'متن مورب')}
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 transition cursor-pointer"
              title="مورب / ایتالیک"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => applyFormat('__', '__', 'متن زیرخط')}
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 transition cursor-pointer"
              title="خط زیرین"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => applyFormat('~~', '~~', 'متن خط‌خورده')}
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 transition cursor-pointer"
              title="خط‌خوردگی"
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </button>

            <span className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />

            <button
              type="button"
              onClick={() => applyLinePrefix('## ')}
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 transition cursor-pointer"
              title="سرتیتر بزرگ (H2)"
            >
              <Heading2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => applyLinePrefix('### ')}
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 transition cursor-pointer"
              title="سرتیتر متوسط (H3)"
            >
              <Heading3 className="w-3.5 h-3.5" />
            </button>

            <span className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />

            <button
              type="button"
              onClick={() => applyLinePrefix('• ')}
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 transition cursor-pointer"
              title="فهرست نشانه‌دار (لیست)"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => applyLinePrefix('1. ')}
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 transition cursor-pointer"
              title="فهرست شماره‌دار"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => applyLinePrefix('> ')}
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 transition cursor-pointer"
              title="نقل قول / کادر تاکید"
            >
              <Quote className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => applyLinePrefix('\n---\n')}
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 transition cursor-pointer"
              title="خط جداکننده افقی"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleClearFormat}
              className="p-1.5 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg transition cursor-pointer"
              title="پاک کردن فرمت‌ها"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mode Switcher: Write vs Preview */}
          <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-700/80 p-0.5 rounded-xl text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('write')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                activeTab === 'write'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Edit3 className="w-3 h-3" />
              <span>ویرایش</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                activeTab === 'preview'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>پیش‌نمایش</span>
            </button>
          </div>
        </div>

        {/* Editor Body */}
        {activeTab === 'write' ? (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            style={{ minHeight }}
            className="w-full p-3.5 bg-transparent text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none resize-y"
          />
        ) : (
          <div
            style={{ minHeight }}
            className="p-4 bg-slate-50/40 dark:bg-slate-950/40 overflow-y-auto"
          >
            {renderFormattedPreview(value)}
          </div>
        )}

        {/* Footer Statistics */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50/70 dark:bg-slate-850 text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span>{toPersianDigits(charCount)} کاراکتر</span>
            <span>•</span>
            <span>{toPersianDigits(wordCount)} کلمه</span>
          </div>
          <span className="text-slate-400 font-mono text-[9px]">
            Markdown & HTML Compatible
          </span>
        </div>
      </div>
    </div>
  );
};
