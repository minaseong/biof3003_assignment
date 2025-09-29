// app/api/handle-record/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Record from '@/models/Record';

// POST Handler
export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const newRecord = await Record.create(body);
    return NextResponse.json({ success: true, data: newRecord }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

// GET Handler - gets aggregated data for all records
export async function GET() {
  try {
    await dbConnect();
    
    // Get aggregated data for all records (no subjectId filter)
    const pipeline = [
      {
        $group: {
          _id: null,
          avgHeartRate: { $avg: '$heartRate.bpm' },
          avgHRV: { $avg: '$hrv.sdnn' },
        },
      },
    ];
    const result = await Record.aggregate(pipeline);
    
    if (!result.length) {
      return NextResponse.json(
        { success: true, avgHeartRate: 0, avgHRV: 0 },
        { status: 200 }
      );
    }
    
    return NextResponse.json({ success: true, ...result[0] }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}