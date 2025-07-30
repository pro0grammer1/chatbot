import { NextResponse } from 'next/server';

interface ChatbotRequest {
  message: string;
}

interface ChatbotResponse {
  reply?: string;
  response?: string;
  error?: string;
  [key: string]: unknown;
}

interface FetchError extends Error {
  code?: string;
  cause?: unknown;
}

function isFetchError(error: unknown): error is FetchError {
  return error instanceof Error && 'code' in error;
}

function isAbortError(error: unknown): error is Error & { name: 'AbortError' } {
  return error instanceof Error && error.name === 'AbortError';
}

export async function POST(req: Request) {
  try {
    const body: ChatbotRequest = await req.json();

    if (!body.message || typeof body.message !== 'string') {
      return NextResponse.json(
        { error: 'Valid message is required' },
        { status: 400 }
      );
    }

    const maxRetries = 2;
    const timeout = 10000; 

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempt ${attempt} to reach external chatbot API`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch('https://gfg-chatbot-pied.vercel.app/chatbot', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: body.message }),
          signal: controller.signal, 
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          console.error('External API error:', response.status, response.statusText);
          
         if (response.status === 429) {
            return NextResponse.json(
              { error: 'Rate limit exceeded. Please try again in a few minutes.' },
              { status: 429 }
            );
          }
          
          if (response.status >= 500) {
            throw new Error(`Server error: ${response.status}`);
          }
          
          return NextResponse.json(
            { error: 'Chatbot service temporarily unavailable' },
            { status: 503 }
          );
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error('Non-JSON response from external API:', contentType);
          const textResponse = await response.text();
          console.error('Response body:', textResponse);
          
          return NextResponse.json(
            { error: 'Invalid response from chatbot service' },
            { status: 502 }
          );
        }

        const responseData: ChatbotResponse = await response.json();
        return NextResponse.json(responseData);

      } catch (fetchError: unknown) {
        const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error';
        console.error(`Attempt ${attempt} failed:`, errorMessage);
        
        if (attempt === maxRetries) {
          throw fetchError;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

  } catch (err: unknown) {
    console.error('Chatbot API error:', err);

    if (isAbortError(err) || (isFetchError(err) && err.code === 'UND_ERR_CONNECT_TIMEOUT')) {
      return NextResponse.json(
        { error: 'Chatbot service is taking too long to respond. Please try again.' },
        { status: 504 }
      );
    }

    if (isFetchError(err) && (err.code === 'ECONNRESET' || err.code === 'ECONNREFUSED')) {
      return NextResponse.json(
        { error: 'Chatbot service is currently unavailable. Please try again later.' },
        { status: 503 }
      );
    }

    if (isFetchError(err) && err.code === 'ENOTFOUND') {
      return NextResponse.json(
        { error: 'Chatbot service not found. Please contact support.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Something went wrong with the chatbot service' },
      { status: 500 }
    );
  }
}