import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { QuadrantType, TaskType } from '@/types/task';

interface AIResponse {
  isIdea: boolean;
  suggestedQuadrant?: QuadrantType;
  taskType?: TaskType | 'idea';
  connectedToPriority?: boolean;
  reasoning?: string;
  alignmentScore?: number;
  urgencyScore?: number;
  importanceScore?: number;
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { task, justification, goal, priority, currentQuadrant, personalContext } = await request.json();

    if (!task) {
      return NextResponse.json({ error: 'Task text is required' }, { status: 400 });
    }

    console.log("[API] Analyzing task:", task.substring(0, 30));
    console.log("[API] User goal:", goal);
    console.log("[API] User priority:", priority);
    console.log("[API] Current quadrant:", currentQuadrant);

    // Create a more detailed prompt for the AI
    const prompt = `
You are an expert task management assistant that helps users analyze and categorize their tasks or ideas.

CONTEXT:
- User's current goal: "${goal || 'Not specified'}"
- User's current priority: "${priority || 'Not specified'}"
- Current quadrant assignment: ${currentQuadrant || 'Not specified'}
- Personal Context: "${personalContext || 'Not specified'}"

Use the personal context to better understand the user's priorities, work style, and what makes tasks urgent or important to them. This should influence how you categorize tasks.

TASK TO ANALYZE: "${task}"
${justification ? `User's justification: "${justification}"` : ''}

STEP 1: DETERMINE IF THIS IS AN IDEA OR A TASK
First, determine if this is an idea (something to consider or explore later) or a task.

Characteristics of IDEAS:
- Might start with phrases like "Idea:", "Maybe I should", "I wonder if", "It would be interesting to", "What if", "Consider"
- Describes a concept, possibility, or future consideration rather than an immediate action
- Lacks specific actionable steps or clear completion criteria
- Often more abstract or exploratory in nature
- Usually requires further development before it can be acted upon

Characteristics of TASKS:
- Starts with action verbs like "Call", "Write", "Schedule", "Buy", "Finish", "Complete" (but not limited to)
- Has clear completion criteria - you know when it's done
- Describes a specific action that can be taken immediately
- Is concrete rather than abstract
- Has an implied or explicit deadline

STEP 2: IF THIS IS A TASK, DETERMINE THE APPROPRIATE QUADRANT
For tasks, analyze and categorize into one of four quadrants based on urgency and importance:

Quadrant 1 (q1) - Urgent & Important:
- Tasks that need immediate attention
- Tasks with imminent deadlines (today/tomorrow)
- Tasks with significant consequences if not completed soon
- Tasks directly related to the user's stated priorities or goals
- Examples: "Submit report due tomorrow", "Prepare for tomorrow's presentation"

Quadrant 2 (q2) - Important but Not Urgent:
- Tasks aligned with long-term goals and priorities
- Tasks that are important for personal/professional growth
- Tasks that prevent future urgent matters
- Tasks without immediate deadlines but high value
- Examples: "Plan next quarter's strategy", "Learn new programming language"

Quadrant 3 (q3) - Urgent but Not Important:
- Tasks with deadlines but limited long-term value
- Tasks that are urgent for others but not aligned with user's priorities
- Interruptions and some meetings
- Examples: "Respond to non-critical email", "Attend optional meeting"

Quadrant 4 (q4) - Neither Urgent nor Important:
- Tasks with little value or urgency
- Distractions and time-wasters
- Tasks that could be eliminated
- Examples: "Browse social media", "Organize old files"

STEP 3: DETERMINE THE TASK TYPE
Determine if this is a 'personal' or 'work' task based on context.

STEP 4: FOR IDEAS ONLY - DETERMINE IF CONNECTED TO PRIORITY
If this is an idea, determine if it's connected to the user's stated priority. An idea is connected to a priority if:
- It directly relates to achieving the stated priority
- It could significantly impact the priority if implemented
- It addresses a challenge or opportunity related to the priority

STEP 5: PROVIDE REASONING SCORES (1-10)
For tasks only, rate the following on a scale of 1-10:
- Alignment Score: How well does this align with the user's goals/priorities?
- Urgency Score: How time-sensitive is this task?
- Importance Score: How significant is this task for long-term success?

RESPONSE FORMAT:
Return a JSON object with the following structure:
{
  "isIdea": boolean, // true if this is an idea, false if it's an actionable task
  "suggestedQuadrant": "q1" | "q2" | "q3" | "q4", // only for tasks, not for ideas
  "taskType": "personal" | "work" | "idea", // "idea" if isIdea is true
  "connectedToPriority": boolean, // only for ideas, indicates if the idea is connected to the user's priority
  "reasoning": string, // detailed explanation for your categorization
  "alignmentScore": number, // 1-10, only for tasks
  "urgencyScore": number, // 1-10, only for tasks
  "importanceScore": number // 1-10, only for tasks
}
`;

    // Call OpenAI API with a lower temperature for more consistent results
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      temperature: 0.2, // Lower temperature for more consistent results
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: `Analyze this task: "${task}"` }
      ],
    });

    // Extract the response
    const responseContent = completion.choices[0]?.message?.content || '';
    console.log("[API] Raw AI response:", responseContent);

    try {
      // Clean up the response content
      const cleanedContent = responseContent.trim();
      let jsonResponse;

      // Try different parsing strategies
      try {
        // First attempt: Try to parse the entire response as JSON
        jsonResponse = JSON.parse(cleanedContent);
      } catch (_) {
        try {
          // Second attempt: Try to find a JSON object in the response
          const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            jsonResponse = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('No JSON object found in response');
          }
        } catch (_) {
          // Third attempt: Try to extract and sanitize key-value pairs
          const pairs = cleanedContent.match(/"([^"]+)"\s*:\s*([^}]+?)(?=\s*[,}])/g);
          
          if (pairs) {
            // Clean and normalize each pair
            const cleanPairs = pairs.map(pair => {
              // Split into key and value parts
              const [key, value] = pair.split(':').map(part => part.trim());
              
              // Handle string values (may contain escaped quotes)
              if (value.startsWith('"')) {
                // Find the last quote that's not escaped
                const valueContent = value.replace(/^"/, '').replace(/([^\\])".*$/, '$1');
                return `${key}: "${valueContent}"`;
              }
              
              // Handle boolean and number values
              if (['true', 'false'].includes(value.toLowerCase()) || !isNaN(Number(value))) {
                return `${key}: ${value.toLowerCase()}`;
              }
              
              // Default to treating as string
              return `${key}: "${value.replace(/"/g, '\\"')}"`;
            });
            
            try {
              const jsonStr = '{' + cleanPairs.join(',') + '}';
              console.log('[DEBUG] Attempting to parse:', jsonStr);
              jsonResponse = JSON.parse(jsonStr);
            } catch (parseError) {
              console.error('[ERROR] Failed to parse cleaned JSON:', parseError);
              // Fallback to basic object construction
              jsonResponse = pairs.reduce((acc, pair) => {
                const [key, value] = pair.split(':').map(part => part.trim());
                const cleanKey = key.replace(/"/g, '');
                const cleanValue = value.toLowerCase();
                acc[cleanKey] = ['true', 'false'].includes(cleanValue) ? 
                  cleanValue === 'true' : 
                  value.replace(/^"|"$/g, '');
                return acc;
              }, {} as Record<string, string | boolean>);
            }
          } else {
            throw new Error('Could not extract key-value pairs from response');
          }
        }
      }

      console.log("[API] Successfully parsed response:", jsonResponse);

      // Validate and normalize the response
      const normalizedResponse: AIResponse = {
        isIdea: Boolean(jsonResponse.isIdea),
        suggestedQuadrant: (!jsonResponse.isIdea && jsonResponse.suggestedQuadrant) 
          ? jsonResponse.suggestedQuadrant 
          : (currentQuadrant || 'q4'),
        taskType: jsonResponse.taskType || (jsonResponse.isIdea ? 'idea' : 'work'),
        connectedToPriority: jsonResponse.isIdea 
          ? Boolean(jsonResponse.connectedToPriority) 
          : undefined,
        reasoning: jsonResponse.reasoning || 'No reasoning provided',
        alignmentScore: !jsonResponse.isIdea 
          ? (Number(jsonResponse.alignmentScore) || 5) 
          : undefined,
        urgencyScore: !jsonResponse.isIdea 
          ? (Number(jsonResponse.urgencyScore) || 5) 
          : undefined,
        importanceScore: !jsonResponse.isIdea 
          ? (Number(jsonResponse.importanceScore) || 5) 
          : undefined
      };

      // Validate the quadrant value
      if (!['q1', 'q2', 'q3', 'q4'].includes(normalizedResponse.suggestedQuadrant)) {
        normalizedResponse.suggestedQuadrant = currentQuadrant || 'q4';
      }

      // Validate the task type
      if (!['personal', 'work', 'idea'].includes(normalizedResponse.taskType)) {
        normalizedResponse.taskType = jsonResponse.isIdea ? 'idea' : 'work';
      }

      // Validate scores are within range
      (['alignmentScore', 'urgencyScore', 'importanceScore'] as const).forEach(score => {
        if (normalizedResponse[score] !== undefined) {
          normalizedResponse[score] = Math.max(1, Math.min(10, normalizedResponse[score] || 5));
        }
      });

      return NextResponse.json(normalizedResponse);
    } catch (parseError) {
      console.error("[API] Error parsing AI response:", parseError);
      console.error("[API] Response content:", responseContent);
      
      // Return a fallback response with the current quadrant
      return NextResponse.json({
        isIdea: false,
        suggestedQuadrant: currentQuadrant || 'q4',
        taskType: 'work',
        reasoning: 'Could not analyze task. Using default values.',
        alignmentScore: 5,
        urgencyScore: 5,
        importanceScore: 5
      });
    }
  } catch (error) {
    console.error("[API] Error in analyze-reflection route:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
