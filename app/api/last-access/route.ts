// app/api/last-access/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Record from '@/models/Record';
import { RecordData } from '@/app/types';

export async function GET(request: Request) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const subjectId = searchParams.get('subjectId');

        if (!subjectId) {
            return NextResponse.json(
                { success: false, error: 'Missing subjectId in query parameters' },
                { status: 400 }
            );
        }

        // Get last access time
        const lastRecord = await Record.findOne({ subjectId })
            .sort({ timestamp: -1 })
            .select('timestamp')
            .lean() as { timestamp: Date } | null;

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