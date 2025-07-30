import { auth } from '@/app/auth';
import { NextResponse } from 'next/server';
import { connectDB } from '@/db/connect';
import { AppInfo } from '@/db/appInfo';
import { User } from '@/db/userInfo';

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();

  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const appInfo = await AppInfo.findOne({ userId: user._id }).sort({ 'qna.timeStamp': 1 });

  if (!appInfo) {
    return NextResponse.json({ qna: [] });
  }

  return NextResponse.json({
    id: appInfo._id.toString(),
    qna: appInfo.qna.sort((a:any, b:any) => new Date(a.timeStamp).getTime() - new Date(b.timeStamp).getTime()),
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { question, answer } = body;
    
    if (!question || typeof question !== 'string') {
      return NextResponse.json({ 
        error: 'Question must be a valid string' 
      }, { status: 400 });
    }

    if (!answer) {
      return NextResponse.json({ 
        error: 'Answer is required' 
      }, { status: 400 });
    }

    let answerString: string;
    if (typeof answer === 'string') {
      answerString = answer.trim();
    } else {
      answerString = JSON.stringify(answer);
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const newQnA = {
      question: question.trim(),
      answer: answerString,
      timeStamp: new Date()
    };

    const result = await AppInfo.findOneAndUpdate(
      { userId: user._id },
      { 
        $push: { qna: newQnA },
        $setOnInsert: { userId: user._id }
      },
      { 
        upsert: true, 
        new: true 
      }
    );

    return NextResponse.json({ 
      success: true,
      message: newQnA,
      qnaId: result.qna[result.qna.length - 1]._id 
    });

  } catch (error) {
    console.error('POST /api/app-info error:', error);
    return NextResponse.json({ 
      error: 'Invalid request' 
    }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();

  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Clear all messages for this user
  await AppInfo.updateOne(
    { userId: user._id },
    { $set: { qna: [] } }
  );

  return NextResponse.json({ success: true });
}