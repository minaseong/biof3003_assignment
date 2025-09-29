// app/api/save-record/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Record from '@/models/Record';

/**
 * API route for saving PPG data records to MongoDB
 * 
 * POST /api/save-record
 * 
 * Request body:
 * {
 *   subjectId: string,      // User identifier
 *   heartRate: {           // Heart rate measurements
 *     bpm: number,         // Beats per minute
 *     confidence: number   // Confidence score (0-1)
 *   },
 *   hrv: {                // Heart Rate Variability measurements
 *     sdnn: number,       // Standard Deviation of NN intervals
 *     confidence: number  // Confidence score (0-1)
 *   },
 *   ppgData: number[],    // Raw PPG signal data
 *   timestamp?: Date      // Optional timestamp (defaults to current time)
 * }
 * 
 * Response:
 * {
 *   success: boolean,     // Whether the operation was successful
 *   data?: Record,        // The saved record (if successful)
 *   error?: string        // Error message (if unsuccessful)
 * }
 */
export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();

    console.log('Received request body:', body); // Add logging to verify incoming data

    const { subjectId, heartRate, hrv, ppgData, timestamp } = body;

    if (!subjectId) {
      console.error('Missing subjectId in request body');
      return NextResponse.json(
        { success: false, error: 'Missing subjectId in request body' },
        { status: 400 }
      );
    }

    // Create a new record including the subjectId
    const newRecord = await Record.create({
      subjectId,
      heartRate,
      hrv,
      ppgData,
      timestamp: timestamp || new Date(),
    });

    console.log('Saved record:', newRecord); // Log the saved record

    return NextResponse.json(
      { success: true, data: newRecord },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error saving record:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

// GET Handler
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
        { success: true, avgHeartRate: 0, avgHRV: 0 },
        { status: 200 }
      );
    }

    const { avgHeartRate, avgHRV } = result[0];
    return NextResponse.json(
      { success: true, avgHeartRate, avgHRV },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}