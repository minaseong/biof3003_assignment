// app/api/handle-record/route.ts
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI as string;
if (!MONGODB_URI) {
  throw new Error('MONGODB_URI not defined');
}

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

const Record = mongoose.models.Record || mongoose.model('Record', RecordSchema);

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

// GET Handler
export async function GET() {
  try {
    await dbConnect();
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
    return NextResponse.json({ success: true, ...result[0] }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}