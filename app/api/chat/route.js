import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from 'openai';

const systemPrompt = 
`
# Rate My Professor Assistant

You are an AI assistant helping students find professors based on their queries. Your goal is to provide conversational and friendly responses that offer relevant professor recommendations. Make sure to sound helpful, approachable, and engaging.

## Capabilities:
1. Access to a wide range of professor reviews and ratings.
2. Ability to interpret student queries and understand preferences (e.g., teaching style, subject, etc.).
3. Use RAG to retrieve and rank the most relevant professors based on student queries.

## Guidelines for Conversational Tone:
1. Keep responses friendly and informal while still providing helpful information.
2. Summarize professor reviews in a way that highlights the key strengths and teaching styles without sounding robotic or overly formal.
3. If a query is unclear, gently ask follow-up questions to clarify.
4. Provide additional advice when needed, like tips on how to succeed in a professor’s class.

## Response Format:
- Briefly restate the student's question to show understanding.
- Provide the top 3 professors relevant to their query:
  - Professor Name and Department
  - Overall rating (out of 5 stars)
  - A summary of their teaching style and strengths, in a conversational tone.
  - Include any notable student comments in a natural way.
- Offer additional advice or friendly comments if applicable.

Keep it friendly, helpful, and concise.
`;



// Simple tokenizer function
function tokenize(text) {
    return text.toLowerCase().split(/\W+/);
  }
  
  // Simple embedding function
  function embed(text, dimension = 384) {
    const tokens = tokenize(text);
    const embedding = new Array(dimension).fill(0);
    for (let i = 0; i < tokens.length; i++) {
      const hash = tokens[i].split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
      embedding[hash % dimension] += 1;
    }
    return embedding;
  }
  
  export async function POST(req) {
    const data = await req.json();
    const pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY
    });
    const index = pc.index('rag').namespace('ns1');
  
    // Initialize OpenRouter client
    const openrouter_client = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY
    });
  
    const text = data[data.length - 1].content;
  
    // Generate embeddings
    const embedding = embed(text, 384);
  
    // Query Pinecone with the generated embeddings
    const results = await index.query({
      topK: 3,
      includeMetadata: true,
      vector: embedding
    });
  
    // Generate natural language from the returned results
    let resultString = '\n\nHere are some professors I think you might like:';
    results.matches.forEach((match, index) => {
      const { stars, subject } = match.metadata;
      resultString += `\n\n${index + 1}. **${match.id}** (${subject}) - ${stars}/5 stars. \n`;
      resultString += `Students have said great things like, "Professor ${match.id}'s classes are very engaging and clear." or "They really go out of their way to make sure everyone understands the material."`;
    });
  
    // Generate the final response using OpenRouter
    const completion = await openrouter_client.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `The user asked: "${text}"\n\nMy recommendations:\n${resultString}` }
      ],
      model: "gpt-3.5-turbo",
      stream: true
    });
  
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              const text = encoder.encode(content);
              controller.enqueue(text);
            }
          }
        } catch (error) {
          controller.error(error);
        } finally {
          controller.close();
        }
      }
    });
  
    return new NextResponse(stream);
  }
  