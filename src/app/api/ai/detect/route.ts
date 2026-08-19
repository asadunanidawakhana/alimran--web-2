import { NextRequest, NextResponse } from 'next/server';
import { geminiKeyPool } from '@/lib/geminiKeyPool';
import { SubjectType, DetectedQuestion } from '@/lib/gemini';
import { deduplicateDetectedQuestions } from '@/lib/noteDeduplicator';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, mimeType = 'image/jpeg', subject = 'Physics' } = body;

    const customApiKey = req.headers.get('x-custom-gemini-key');

    if (!imageBase64) {
      return NextResponse.json({ error: 'imageBase64 is required.' }, { status: 400 });
    }

    const cleanBase64 = imageBase64.includes('base64,')
      ? imageBase64.split('base64,')[1]
      : imageBase64;

    const detectionPrompt = `
You are an expert exam paper analyzer for Al Imran Tenses Learner analyzing a ${subject} question paper or book page.

CRITICAL INSTRUCTIONS:
1. Carefully inspect the ENTIRE image from top to bottom.
2. If the image is blurry, too dark, out of focus, or completely unreadable, DO NOT hallucinate missing text. Return JSON:
   {"isUnclear": true, "questions": [], "unreadableNote": "Image is too blurry, dark, or cropped to read questions clearly. Please upload a clear photo."}

3. Identify EVERY SINGLE individual main question and ALL its subparts/subquestions.
   - Do NOT treat the whole image as one single question.
   - Do NOT combine unrelated questions.
   - Accurately preserve question parts like (a), (b), (c), (i), (ii), etc.
   - Keep the original question text exactly as printed in the image without translating or altering it.
   - Classify each question type as: "Short Question", "Constructed Response", "Descriptive Question", or "Numerical".

4. Output MUST be strictly valid JSON matching this schema:
{
  "isUnclear": false,
  "unreadableNote": "",
  "questions": [
    {
      "id": "q1",
      "questionNumber": "Q1",
      "title": "Short title or summary of Q1",
      "fullText": "Full text of main question if applicable",
      "questionType": "Short Question",
      "parts": [
        { "partId": "(a)", "text": "Define velocity." },
        { "partId": "(b)", "text": "Write its formula and SI unit." }
      ]
    }
  ]
}
`;

    const requestBody = {
      contents: [
        {
          parts: [
            { text: detectionPrompt },
            {
              inlineData: {
                mimeType: mimeType || 'image/jpeg',
                data: cleanBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json',
      },
    };

    const result = await geminiKeyPool.executeGeminiRequest(requestBody, {
      feature: 'NOTES_DETECT',
      customApiKey,
    });

    const parsed = JSON.parse(result.text);
    const isUnclear = Boolean(parsed.isUnclear);
    const unreadableNote = parsed.unreadableNote || '';
    const rawQuestions: DetectedQuestion[] = Array.isArray(parsed.questions) ? parsed.questions : [];

    const dedupedQuestions = deduplicateDetectedQuestions(rawQuestions);

    return NextResponse.json({
      success: true,
      isUnclear,
      unreadableNote,
      questions: dedupedQuestions,
    });
  } catch (err: any) {
    const isPoolExhausted = err?.code === 'AI_POOL_EXHAUSTED' || err?.status === 503;
    const status = isPoolExhausted ? 503 : err?.status || 500;
    const message = isPoolExhausted
      ? 'AI service is temporarily busy. Please connect your own Gemini API key to continue.'
      : err?.message || 'Failed to detect questions from image.';

    return NextResponse.json(
      {
        success: false,
        error: isPoolExhausted ? 'AI_POOL_EXHAUSTED' : 'AI_ERROR',
        message,
      },
      { status }
    );
  }
}
