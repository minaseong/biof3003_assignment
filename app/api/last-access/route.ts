// app/api/last-access/route.ts
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { RecordData } from '@/app/types';

const MONGODB_URI = process.env.MONGODB_URI as string;

// Reuse your existing connection logic
let cached = (global as any).mongoose;
if (!cached) {
    cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
    if (cached.conn) return cached.conn;
    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false });
    }
    cached.conn = await cached.promise;
    return cached.conn;
}

// adjust the record schema for handle record as well as for save record to fetch the correct result from DB
const RecordSchema = new mongoose.Schema({
  subjectId: { type: String, required: true },
  heartRate: {
    bpm: { type: Number, required: true },
    confidence: { type: Number, required: true },
  },
  hrv: {
    sdnn: { type: Number, required: true },
    confidence: { type: Number, required: true },
  },
  ppgData: { type: [Number], required: true },
  timestamp: { type: Date, default: Date.now },
});

// Create the typed model
type RecordDocument = mongoose.Document & RecordData;
const Record = mongoose.models.Record as mongoose.Model<RecordDocument> || 
               mongoose.model<RecordDocument>('Record', RecordSchema);

export async function GET(request: Request) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const subjectId = searchParams.get('subjectId');

        if (!subjectId) {
            return NextResponse.json(
                { success: false, error: 'Missing subjectId' },
                { status: 400 }
            );
        }

        // Explicitly type the lean result to only include timestamp
        const lastRecord = await Record.findOne({ subjectId })
            .sort({ timestamp: -1 })
            .select('timestamp')
            .lean<Pick<RecordData, 'timestamp'>>();

        if (!lastRecord) {
            return NextResponse.json(
                { success: false, error: 'No records found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { success: true, lastAccess: lastRecord.timestamp },
            { status: 200 }
        );

    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}