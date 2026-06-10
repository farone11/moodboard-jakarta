import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

export const runtime = 'edge';

export async function POST(req: Request) {
  const { mood } = await req.json();

  const { object } = await generateObject({
    model: google('models/gemini-2.5-flash'),
    schema: z.object({
      colors: z.array(z.string()).length(3).describe('3 kode hex warna yang cocok sama mood'),
      spots: z.array(z.string()).length(3).describe('3 nama tempat spesifik di Jakarta yang cocok buat mood ini'),
      song: z.string().describe('1 judul lagu + artis Indonesia yang cocok buat mood ini'),
    }),
    prompt: `Kamu adalah kurator mood untuk anak Jakarta umur 20an. User lagi ngerasa: "${mood}". 
    Kasih 3 warna hex, 3 spot nongkrong/healing di Jakarta yang spesifik & real, dan 1 lagu Indonesia yang pas.
    Jawab pake gaya santai Jakarta.`,
  });

  return Response.json(object);
}