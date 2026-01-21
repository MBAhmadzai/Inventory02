'use server';

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { next } from '@genkit-ai/next';

export const ai = genkit({
  plugins: [
    next({
      flows: {
        '/api/flows': {
          module: import('./flows/generate-report-flow'),
        },
      },
    }),
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
    }),
  ],
});
