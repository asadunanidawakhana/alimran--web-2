import { NextRequest, NextResponse } from 'next/server';
import { geminiKeyPool } from '@/lib/geminiKeyPool';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const summary = geminiKeyPool.getStatusSummary();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve key pool status',
        message: err?.message || 'Server error',
      },
      { status: 500 }
    );
  }
}
