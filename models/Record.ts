import mongoose, { Document, Model } from 'mongoose';

// TypeScript interface for the Record document
export interface IRecord extends Document {
  subjectId: string;
  heartRate: {
    bpm: number;
    confidence: number;
  };
  hrv: {
    sdnn: number;
    confidence: number;
  };
  ppgData: number[];
  timestamp: Date;
}

// TypeScript interface for creating a new record (without _id and timestamps)
export interface ICreateRecord {
  subjectId: string;
  heartRate: {
    bpm: number;
    confidence: number;
  };
  hrv: {
    sdnn: number;
    confidence: number;
  };
  ppgData: number[];
  timestamp?: Date;
}

// TypeScript interface for aggregation results
export interface IRecordAggregation {
  _id: null;
  avgHeartRate: number;
  avgHRV: number;
}

const RecordSchema = new mongoose.Schema<IRecord>({
  subjectId: { 
    type: String, 
    required: [true, 'Subject ID is required'],
    trim: true,
    index: true // Add index for better query performance
  },
  heartRate: {
    bpm: { 
      type: Number, 
      required: [true, 'Heart rate BPM is required'],
      min: [0, 'Heart rate must be positive']
    },
    confidence: { 
      type: Number, 
      required: [true, 'Heart rate confidence is required'],
      min: [0, 'Confidence must be between 0 and 1'],
      max: [1, 'Confidence must be between 0 and 1']
    },
  },
  hrv: {
    sdnn: { 
      type: Number, 
      required: [true, 'HRV SDNN is required'],
      min: [0, 'HRV SDNN must be positive']
    },
    confidence: { 
      type: Number, 
      required: [true, 'HRV confidence is required'],
      min: [0, 'Confidence must be between 0 and 1'],
      max: [1, 'Confidence must be between 0 and 1']
    },
  },
  ppgData: { 
    type: [Number], 
    required: [true, 'PPG data is required'],
    validate: {
      validator: function(v: number[]) {
        return v && v.length > 0;
      },
      message: 'PPG data cannot be empty'
    }
  },
  timestamp: { 
    type: Date, 
    default: Date.now,
    index: true // Add index for better query performance
  },
}, {
  timestamps: false, // We're using custom timestamp field
  versionKey: false, // Disable __v field
});

// Add compound index for efficient queries
RecordSchema.index({ subjectId: 1, timestamp: -1 });

// Use an existing model if available or compile a new one
const Record = mongoose.models.Record || mongoose.model<IRecord>('Record', RecordSchema);

export default Record;
export type { IRecord, ICreateRecord, IRecordAggregation }; 