// src/db/appInfo.ts
import mongoose from 'mongoose';

const appInfoSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  qna: [{
    question: { type: String, required: true },
    answer: { type: String, required: true },
    timeStamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

export const AppInfo = mongoose.models.AppInfo || mongoose.model('AppInfo', appInfoSchema);