import { NextResponse } from 'next/server';
import { connectDB } from '@/db/connect';
import { User } from '@/db/userInfo';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    await connectDB();

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ message: 'User already exists!' }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 10);
    await User.create({ name, email, password: hashed });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}
