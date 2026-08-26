import React from 'react';
import { toPersianDigits } from '../utils/persianDate';

interface FormattedTextProps {
  text: string;
  className?: string;
}

/**
 * Lightweight Rich Text parser and renderer for formatting reports
 * Supports:
 * - **bold** or __bold__
 * - *italic* or _italic_
 * - ~~strikethrough~~
 * - Headers (# H1, ## H2, ### H3)
 * - Blockquotes (> quote)
 * - Bullet lists (•, -, *)
 * - Numbered lists (1., 2., etc.)
 * - Linebreaks and paragraphs
 */
export const FormattedText: React.FC<FormattedTextProps> = ({ text, className = '' }) => {
  if (!text) return null;

  // Split into lines
  const lines = text.split('\n');

  // Inline formatting helper
  const parseInline = (lineText: string): React.ReactNode[] => {
    // Regex for bold, italic, strikethrough
    const parts: React.ReactNode[] = [];
    let remaining = lineText;
    let keyIdx = 0;

    // Token regex: **bold**, __bold__, *italic*, _italic_, ~~strikethrough~~
    const inlineRegex = /(\*\*|__)(.*?)\1|(\*|_)(.*?)\3|(~~)(.*?)\5/;

    while (remaining) {
      const match = inlineRegex.exec(remaining);
      if (!match) {
        parts.push(remaining);
        break;
      }

      const matchIndex = match.index;
      if (matchIndex > 0) {
        parts.push(remaining.substring(0, matchIndex));
      }

      // Check which group matched
      if (match[1] && match[2]) {
        // Bold: **text** or __text__
        parts.push(
          <strong key={`b-${keyIdx++}`} className="font-black text-slate-900 dark:text-white">
            {match[2]}
          </strong>
        );
      } else if (match[3] && match[4]) {
        // Italic: *text* or _text_
        parts.push(
          <em key={`i-${keyIdx++}`} className="italic font-medium text-slate-800 dark:text-slate-200">
            {match[4]}
          </em>
        );
      } else if (match[5] && match[6]) {
        // Strikethrough: ~~text~~
        parts.push(
          <del key={`s-${keyIdx++}`} className="line-through text-slate-400 dark:text-slate-500">
            {match[6]}
          </del>
        );
      }

      remaining = remaining.substring(matchIndex + match[0].length);
    }

    return parts;
  };

  return (
    <div className={`space-y-2 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300 ${className}`}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // H1 Heading
        if (trimmed.startsWith('# ')) {
          return (
            <h2 key={idx} className="text-base sm:text-lg font-black text-slate-900 dark:text-white pt-2 pb-1">
              {parseInline(trimmed.replace(/^#\s+/, ''))}
            </h2>
          );
        }

        // H2 Heading
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={idx} className="text-sm sm:text-base font-black text-[#173b82] dark:text-blue-400 pt-1.5 pb-0.5 border-b border-slate-100 dark:border-slate-800">
              {parseInline(trimmed.replace(/^##\s+/, ''))}
            </h3>
          );
        }

        // H3 Heading
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="text-xs sm:text-sm font-black text-blue-700 dark:text-blue-300 pt-1 pb-0.5">
              {parseInline(trimmed.replace(/^###\s+/, ''))}
            </h4>
          );
        }

        // Blockquote
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote key={idx} className="border-r-4 border-blue-500 pr-3 py-1 bg-blue-50/60 dark:bg-blue-950/40 text-slate-800 dark:text-slate-200 rounded-l-lg italic text-xs leading-relaxed my-1">
              {parseInline(trimmed.replace(/^>\s+/, ''))}
            </blockquote>
          );
        }

        // Bullet list item
        if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={idx} className="flex items-start gap-2 pr-2 my-0.5">
              <span className="text-blue-600 dark:text-blue-400 font-bold mt-0.5">•</span>
              <div className="flex-1 min-w-0">
                {parseInline(trimmed.replace(/^[•\-\*]\s+/, ''))}
              </div>
            </div>
          );
        }

        // Numbered list item
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          const num = numMatch[1];
          const rest = numMatch[2];
          return (
            <div key={idx} className="flex items-start gap-2 pr-2 my-0.5">
              <span className="text-blue-600 dark:text-blue-400 font-bold min-w-4 shrink-0 text-left">
                {toPersianDigits(num)}.
              </span>
              <div className="flex-1 min-w-0">
                {parseInline(rest)}
              </div>
            </div>
          );
        }

        // Normal paragraph line
        return (
          <p key={idx} className="leading-relaxed">
            {parseInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
};
