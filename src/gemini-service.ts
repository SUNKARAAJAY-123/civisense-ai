import { GoogleGenAI, Type } from '@google/genai';
import { Issue } from './types';

// Lazy-loaded client to avoid crashing on startup if the key is missing in .env
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set. AI analysis will run in fallback mock mode.');
      throw new Error('GEMINI_API_KEY is required for AI features');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export interface AIAnalysisResult {
  title: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  department: string;
  urgency: string;
  precautions: string;
  estimatedResolution: string;
  tags: string[];
  duplicateOf?: string; // ID of duplicate issue, if found
}

// Fallback generator if API key is not configured or fails
export function getMockAnalysis(categoryHint?: string): AIAnalysisResult {
  const categories = [
    {
      category: 'Pothole',
      title: 'Active Asphalt Depression & Road Erosion',
      description: 'A deep crater-like pothole has opened up in the lane, posing a risk to vehicles, causing alignment damage and dangerous swerving.',
      severity: 'high' as const,
      department: 'Department of Public Works (DPW)',
      urgency: 'High',
      precautions: 'Reduce speed when driving through this block. Avoid hard braking directly on the gap.',
      estimatedResolution: '48 Hours',
      tags: ['road-hazard', 'pothole', 'traffic-safety'],
    },
    {
      category: 'Illegal Dumping',
      title: 'Bulk Hazardous Rubbish & Discarded Materials',
      description: 'Multiple bags of construction debris and chemicals have been illegally discarded on the public path, posing environmental hazards.',
      severity: 'critical' as const,
      department: 'Environmental Health & Parks Department',
      urgency: 'High',
      precautions: 'Do not handle bags directly. Prevent domestic animals or children from contacting the site.',
      estimatedResolution: '24 Hours',
      tags: ['pollution', 'illegal-dumping', 'waste-management'],
    },
    {
      category: 'Broken Streetlight',
      title: 'Defective Pedestrian Corridor Luminaire',
      description: 'Streetlight is completely dark or flashing violently, creating blacked-out zones on the sidewalk that increase safety vulnerability.',
      severity: 'medium' as const,
      department: 'Bureau of Light & Power',
      urgency: 'Medium',
      precautions: 'Avoid dark sidewalk pockets. Walk with companions and stay under store awnings if possible.',
      estimatedResolution: '3 Days',
      tags: ['streetlight', 'dark-zones', 'pedestrian-safety'],
    }
  ];

  const matched = categories.find(c => c.category.toLowerCase() === categoryHint?.toLowerCase()) || categories[0];
  return {
    ...matched,
    duplicateOf: undefined
  };
}

/**
 * Analyzes an image of a civic issue and matches with existing issues to prevent duplicates
 */
export async function analyzeIssueImage(
  imageBase64: string,
  existingActiveIssues: Issue[],
  categoryHint?: string
): Promise<AIAnalysisResult> {
  try {
    const ai = getAiClient();

    // Prepare existing active issues context for duplicate detection
    const issuesContext = existingActiveIssues.map(i => ({
      id: i.id,
      title: i.title,
      category: i.category,
      address: i.location.address,
      lat: i.location.lat,
      lng: i.location.lng,
      status: i.status
    }));

    // Convert base64 format (stripping MIME type if present)
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const systemPrompt = `You are an expert AI civic architect and municipal engineer. 
Analyze the uploaded image representing a hyperlocal community issue and categorize it.
Also review the list of existing reported issues to determine if the new report is a duplicate (>80% semantic similarity in the same vicinity).

You MUST output your response in JSON matching this schema:
{
  "title": "A highly professional, concise, startup-grade title describing the issue",
  "description": "An exhaustive, detailed, professional description suitable for municipal dispatch",
  "category": "Must be one of: 'Pothole', 'Illegal Dumping', 'Broken Streetlight', 'Water Leakage', 'Road Damage', 'Drainage Block', 'Tree Fallen', 'Other'",
  "severity": "Must be one of: 'low', 'medium', 'high', 'critical'",
  "department": "The recommended department, e.g., 'Department of Public Works (DPW)', 'Bureau of Light & Power', 'Environmental Health & Parks Department', or 'Water Enterprise'",
  "urgency": "One of: 'Low', 'Medium', 'High', 'Immediate'",
  "precautions": "Important safety tips and precautions for citizens passing by this hazard",
  "estimatedResolution": "Sensible resolution timeline, e.g., '24 Hours', '48 Hours', '3 Days', '5 Days'",
  "tags": ["3-4 relevant lower-case keyword tags"],
  "duplicateOf": "If this issue matches one of the existing issues below, provide its ID. If no match, leave null"
}

Existing Active Issues list to scan for duplicate reports:
${JSON.stringify(issuesContext, null, 2)}
`;

    const imagePart = {
      inlineData: {
        mimeType: 'image/jpeg',
        data: cleanBase64,
      },
    };

    const textPart = {
      text: `Analyze the attached image. ${categoryHint ? `User marked this as potentially: ${categoryHint}.` : ''} Assess duplicate status against the existing active reports. Provide the structured JSON output.`,
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: { parts: [imagePart, textPart] },
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            category: { 
              type: Type.STRING,
              description: "Must be one of: Pothole, Illegal Dumping, Broken Streetlight, Water Leakage, Road Damage, Drainage Block, Tree Fallen, Other"
            },
            severity: { 
              type: Type.STRING,
              description: "Must be one of: low, medium, high, critical"
            },
            department: { type: Type.STRING },
            urgency: { type: Type.STRING },
            precautions: { type: Type.STRING },
            estimatedResolution: { type: Type.STRING },
            tags: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            duplicateOf: { 
              type: Type.STRING,
              description: "The ID of the matching duplicate issue, or null if it is a new unique report"
            }
          },
          required: ['title', 'description', 'category', 'severity', 'department', 'urgency', 'precautions', 'estimatedResolution', 'tags']
        }
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('Empty response from Gemini');
    }

    const parsed = JSON.parse(text) as AIAnalysisResult;
    // Ensure correct types
    if (parsed.duplicateOf === 'null' || parsed.duplicateOf === '') {
      parsed.duplicateOf = undefined;
    }
    return parsed;

  } catch (err) {
    console.error('Gemini API analysis failed, using smart mock:', err);
    return getMockAnalysis(categoryHint);
  }
}
