import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Record from '@/models/Record';

export async function GET(request: Request) {
  try {
    await dbConnect();

    // Extract subjectId from query parameters
    const url = new URL(request.url);
    const subjectId = url.searchParams.get('subjectId');

    if (!subjectId) {
      return NextResponse.json(
        { success: false, error: 'Missing subjectId in query parameters' },
        { status: 400 }
      );
    }

    // Get last access date
    const lastRecord = await Record.findOne({ subjectId }).sort({ timestamp: -1 });
    
    // Aggregate historical data using MongoDB aggregation pipeline
    const pipeline = [
      {
        $match: { subjectId }, // Filter records by subjectId
      },
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
      // Return default values if no data exists for the subjectId
      return NextResponse.json(
        { 
          success: true, 
          avgHeartRate: 0, 
          avgHRV: 0,
          lastAccess: null
        },
        { status: 200 }
      );
    }

    const { avgHeartRate, avgHRV } = result[0];
    return NextResponse.json(
      { 
        success: true, 
        avgHeartRate, 
        avgHRV,
        lastAccess: lastRecord?.timestamp || null
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}