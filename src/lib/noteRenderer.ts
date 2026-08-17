// ==============================================================================
// AL IMRAN TENSES LEARNER — HIGH-RESOLUTION MULTI-QUESTION NOTE RENDERER
// Converts verified multi-part questions & answers into a branded study note image.
// Full RTL / Urdu Script and English Medium Support.
// ==============================================================================

import { SubjectType, StudyMedium, SolvedQuestionItem } from './gemini';

export interface MultiNoteRenderOptions {
  subject: SubjectType;
  medium: StudyMedium;
  questions: SolvedQuestionItem[];
  noteType: 'short' | 'long';
  dateStr?: string;
  watermarkText?: string;
}

/**
 * Checks if a string contains Urdu / Arabic characters.
 */
function hasUrduChars(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

/**
 * Wraps text into lines that fit within a maximum width on the canvas.
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const lines: string[] = [];
  const rawParagraphs = (text || '').split('\n');

  for (const paragraph of rawParagraphs) {
    if (!paragraph.trim()) {
      lines.push('');
      continue;
    }

    const words = paragraph.split(' ');
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
  }

  return lines;
}

/**
 * Renders a complete educational note card with RTL Urdu or LTR English support.
 */
export async function renderMultiNoteImage(options: MultiNoteRenderOptions): Promise<string> {
  if (typeof window === 'undefined') return '';

  const {
    subject,
    medium,
    questions,
    noteType,
    dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    watermarkText = 'AL IMRAN TENSES LEARNER AI',
  } = options;

  const isUrduMedium = medium === 'Urdu Medium';

  // Render at high resolution (2x scaling)
  const scale = 2;
  const canvasWidth = 960;
  const padding = 44;
  const contentWidth = canvasWidth - padding * 2;

  // Offscreen canvas for layout measurement
  const measureCanvas = document.createElement('canvas');
  const mctx = measureCanvas.getContext('2d');
  if (!mctx) return '';

  // Fonts setup with Urdu fallback
  const fontHeader = 'bold 24px Outfit, Inter, system-ui, sans-serif';
  const fontSub = '600 12px Inter, system-ui, sans-serif';
  const fontQNum = 'bold 18px Outfit, Inter, sans-serif';
  const fontQuestion = '600 15px Inter, system-ui, sans-serif';
  const fontAnswer = isUrduMedium
    ? '17px "Noto Nastaliq Urdu", "Jameel Noori Nastaleeq", "Urdu Typesetting", Tahoma, Inter, sans-serif'
    : '15px Inter, system-ui, sans-serif';

  // Measure Heights
  const headerHeight = 114;
  const footerHeight = 60;
  let totalContentHeight = 0;

  interface MeasuredQuestionBlock {
    questionNumber: string;
    mainTextLines: string[];
    parts: {
      partId?: string;
      qLines: string[];
      aLines: string[];
      isRTL: boolean;
      blockHeight: number;
    }[];
    totalHeight: number;
  }

  const measuredBlocks: MeasuredQuestionBlock[] = [];

  for (const q of questions) {
    mctx.font = fontQuestion;
    const mainTextLines = q.mainQuestionText ? wrapText(mctx, q.mainQuestionText, contentWidth - 40) : [];
    let blockHeight = 40 + (mainTextLines.length > 0 ? mainTextLines.length * 24 + 10 : 0);

    const measuredParts: MeasuredQuestionBlock['parts'] = [];

    if (q.parts && q.parts.length > 0) {
      for (const p of q.parts) {
        mctx.font = fontQuestion;
        const qLines = p.questionText ? wrapText(mctx, `${p.partId ? p.partId + ' ' : ''}${p.questionText}`, contentWidth - 60) : [];
        
        mctx.font = fontAnswer;
        const aLines = wrapText(mctx, p.answer || '', contentWidth - 60);
        const isRTL = isUrduMedium || hasUrduChars(p.answer || '');

        const lineSpacing = isUrduMedium ? 28 : 22;
        const partHeight = (qLines.length > 0 ? qLines.length * 22 + 8 : 0) + (aLines.length * lineSpacing + 24) + 16;
        blockHeight += partHeight;

        measuredParts.push({
          partId: p.partId,
          qLines,
          aLines,
          isRTL,
          blockHeight,
        });
      }
    } else {
      mctx.font = fontAnswer;
      const aLines = wrapText(mctx, 'Answer provided.', contentWidth - 60);
      blockHeight += aLines.length * 24 + 30;
      measuredParts.push({
        qLines: [],
        aLines,
        isRTL: isUrduMedium,
        blockHeight: aLines.length * 24 + 30,
      });
    }

    measuredBlocks.push({
      questionNumber: q.questionNumber || 'Question',
      mainTextLines,
      parts: measuredParts,
      totalHeight: blockHeight + 20,
    });

    totalContentHeight += blockHeight + 24;
  }

  const totalHeight = headerHeight + totalContentHeight + footerHeight + padding * 2;

  // Real canvas
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth * scale;
  canvas.height = totalHeight * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.scale(scale, scale);

  // Background
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, canvasWidth, totalHeight);

  // Card Container
  const cardX = padding / 2;
  const cardY = padding / 2;
  const cardW = canvasWidth - padding;
  const cardH = totalHeight - padding;
  const cardRadius = 24;

  ctx.save();
  ctx.shadowColor = 'rgba(15, 23, 42, 0.08)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = '#ffffff';
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, cardRadius);
  ctx.fill();
  ctx.restore();

  // Card Border
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, cardRadius);
  ctx.stroke();

  // -------------------------------------------------------------
  // WATERMARK
  // -------------------------------------------------------------
  ctx.save();
  ctx.font = '900 36px Outfit, Inter, sans-serif';
  ctx.fillStyle = 'rgba(37, 99, 235, 0.045)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.translate(canvasWidth / 2, totalHeight / 2);
  ctx.rotate(-Math.PI / 8);
  for (let y = -totalHeight; y < totalHeight; y += 180) {
    for (let x = -canvasWidth; x < canvasWidth; x += 420) {
      ctx.fillText(watermarkText, x, y);
    }
  }
  ctx.restore();

  let currentY = cardY + 36;

  // -------------------------------------------------------------
  // 1. HEADER SECTION
  // -------------------------------------------------------------
  // Brand Icon
  ctx.fillStyle = '#2563eb';
  drawRoundedRect(ctx, cardX + 32, currentY, 48, 48, 14);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('AI', cardX + 32 + 24, currentY + 31);
  ctx.textAlign = 'left';

  // Title
  ctx.fillStyle = '#0f172a';
  ctx.font = fontHeader;
  ctx.fillText('Al Imran Tenses Learner', cardX + 92, currentY + 22);

  ctx.fillStyle = '#64748b';
  ctx.font = fontSub;
  ctx.fillText(`${subject.toUpperCase()} • ${medium.toUpperCase()} • EXAM REVISION NOTES`, cardX + 92, currentY + 42);

  // Format Badge
  const isShort = noteType === 'short';
  const badgeText = isShort ? 'SHORT (2-MARK)' : 'LONG (6-MARK)';
  mctx.font = 'bold 11px Inter, sans-serif';
  const badgeWidth = mctx.measureText(badgeText).width + 24;
  const badgeX = cardX + cardW - 32 - badgeWidth;

  ctx.fillStyle = isShort ? '#eff6ff' : '#ecfdf5';
  drawRoundedRect(ctx, badgeX, currentY + 8, badgeWidth, 30, 15);
  ctx.fill();

  ctx.strokeStyle = isShort ? '#bfdbfe' : '#a7f3d0';
  ctx.lineWidth = 1;
  drawRoundedRect(ctx, badgeX, currentY + 8, badgeWidth, 30, 15);
  ctx.stroke();

  ctx.fillStyle = isShort ? '#1d4ed8' : '#047857';
  ctx.font = 'bold 11px Inter, sans-serif';
  ctx.fillText(badgeText, badgeX + 12, currentY + 27);

  currentY += 68;

  // Divider
  ctx.strokeStyle = '#f1f5f9';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cardX + 32, currentY);
  ctx.lineTo(cardX + cardW - 32, currentY);
  ctx.stroke();

  currentY += 24;

  // -------------------------------------------------------------
  // 2. QUESTION BLOCKS WITH URDU / ENGLISH SUPPORT
  // -------------------------------------------------------------
  for (const block of measuredBlocks) {
    const blockX = cardX + 24;
    const blockW = cardW - 48;

    // Outer Container
    ctx.fillStyle = '#ffffff';
    drawRoundedRect(ctx, blockX, currentY, blockW, block.totalHeight - 10, 16);
    ctx.fill();

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, blockX, currentY, blockW, block.totalHeight - 10, 16);
    ctx.stroke();

    // Accent strip
    ctx.fillStyle = '#2563eb';
    drawRoundedRect(ctx, blockX, currentY, 5, block.totalHeight - 10, 2);
    ctx.fill();

    let innerY = currentY + 24;

    // Question Number
    ctx.fillStyle = '#2563eb';
    ctx.font = fontQNum;
    ctx.textAlign = 'left';
    ctx.fillText(block.questionNumber, blockX + 20, innerY);
    innerY += 24;

    // Main Question Text
    if (block.mainTextLines.length > 0) {
      ctx.fillStyle = '#1e293b';
      ctx.font = fontQuestion;
      ctx.textAlign = 'left';
      for (const line of block.mainTextLines) {
        ctx.fillText(line, blockX + 20, innerY);
        innerY += 22;
      }
      innerY += 8;
    }

    // Subparts & Answers
    for (const part of block.parts) {
      // Subpart Question (Always in original language)
      if (part.qLines.length > 0) {
        ctx.fillStyle = '#0f172a';
        ctx.font = '600 14px Inter, sans-serif';
        ctx.textAlign = 'left';
        for (const qLine of part.qLines) {
          ctx.fillText(qLine, blockX + 20, innerY);
          innerY += 20;
        }
      }

      innerY += 4;

      // Answer Label & Text (RTL if Urdu Medium)
      if (part.isRTL) {
        // Urdu RTL Mode
        ctx.fillStyle = '#059669';
        ctx.font = 'bold 13px "Noto Nastaliq Urdu", Tahoma, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('جواب:', blockX + blockW - 20, innerY);
        innerY += 22;

        ctx.fillStyle = '#1e293b';
        ctx.font = fontAnswer;
        ctx.textAlign = 'right';
        for (const aLine of part.aLines) {
          ctx.fillText(aLine, blockX + blockW - 20, innerY);
          innerY += 28;
        }
      } else {
        // English LTR Mode
        ctx.fillStyle = '#059669';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('ANSWER:', blockX + 20, innerY);
        innerY += 18;

        ctx.fillStyle = '#334155';
        ctx.font = fontAnswer;
        ctx.textAlign = 'left';
        for (const aLine of part.aLines) {
          ctx.fillText(aLine, blockX + 20, innerY);
          innerY += 22;
        }
      }

      innerY += 14;
    }

    currentY += block.totalHeight + 14;
  }

  // -------------------------------------------------------------
  // 3. FOOTER
  // -------------------------------------------------------------
  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 12px Inter, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Generated on ${dateStr} • Al Imran Tenses Learner AI • ${medium} • All Selected Parts Solved ✅`, cardX + 28, currentY + 14);

  return canvas.toDataURL('image/png', 1.0);
}

/**
 * Utility to draw rounded rectangles on canvas.
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Downloads a data URL as a PNG file.
 */
export function downloadDataUrlAsPng(dataUrl: string, filename?: string): void {
  if (typeof window === 'undefined' || !dataUrl) return;
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename || `Al_Imran_Study_Note_${Date.now()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
