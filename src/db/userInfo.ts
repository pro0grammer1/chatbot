import mongoose from 'mongoose';

import { connectDB } from './connect';

interface IUser {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  name?: string;
}

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  name: { type: String },
});

export const User = mongoose.models.User || mongoose.model('User', userSchema);

export async function getUser(email: string) {
  await connectDB();
  const user = await User.findOne({ email }).lean<IUser>();
  return user;
}
