import { GoogleGenAI } from "@google/genai";
import { Patient, InjuryProfile } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzePatientProgress = async (patient: Patient): Promise<string> => {
  const ai = getClient();
  
  const prompt = `
    You are an expert physiotherapist assistant. Analyze the following patient data.
    
    Patient: ${patient.name}
    Injury: ${patient.injury}
    
    Recent Progress Logs (Last 5 entries):
    ${patient.logs.slice(-5).map(l => `- Date: ${l.date}, Pain (1-10): ${l.painScore}, ROM: ${l.maxRom}°, Reps: ${l.repsCompleted}, Notes: ${l.notes}`).join('\n')}
    
    Please provide:
    1. A summary of their progress trend.
    2. Specific observations about their pain vs. ROM.
    3. Recommendations for the physiotherapist.
    
    Format the output as a concise Markdown block.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { temperature: 0.3 }
    });

    return response.text || "Unable to generate analysis at this time.";
  } catch (error) {
    console.error("Error calling Gemini:", error);
    return "Error generating analysis.";
  }
};

export const getRecoveryPrediction = async (patient: Patient, injuryProfile: InjuryProfile): Promise<string> => {
    const ai = getClient();

    // Safe access to last log
    const lastLog = patient.logs.length > 0 ? patient.logs[patient.logs.length - 1] : null;
    const latestRom = lastLog ? lastLog.maxRom : 0;
    const latestPain = lastLog ? lastLog.painScore : 0;

    const prompt = `
      You are an advanced clinical prediction bot.
      
      Context:
      Patient Name: ${patient.name}
      Actual Injury: ${patient.injury}
      Physio's Selected Protocol: ${injuryProfile.name}
      Protocol Description: ${injuryProfile.description}
      Standard Milestones: ${injuryProfile.expectedMilestones.join('; ')}
      
      Patient's Current Status:
      - Latest ROM: ${latestRom} degrees
      - Latest Pain: ${latestPain}/10
      - Weeks since start: Approx ${(patient.logs.length / 3).toFixed(1)} weeks
      
      Task:
      Compare the patient's actual progress against the standard protocol milestones.
      Predict the trajectory for the next 2 weeks.
      Are they recovering faster or slower than the traditional curve for this specific injury?
      
      Keep it conversational but clinical.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { temperature: 0.4 }
        });
        return response.text || "Prediction unavailable.";
    } catch (error) {
        return "System error: Unable to compute prediction.";
    }
};

export const getProgressBooster = async (patient: Patient): Promise<string> => {
    const ai = getClient();
    
    // Safe access to last log
    const lastLog = patient.logs.length > 0 ? patient.logs[patient.logs.length - 1] : null;
    const painScore = lastLog ? lastLog.painScore : 0;
    const reps = lastLog ? lastLog.repsCompleted : 0;

    const prompt = `
        Write a 3-sentence motivational "Progress Booster" for a patient named ${patient.name} recovering from ${patient.injury}.
        Their latest pain score was ${painScore}/10 (lower is better) and they completed ${reps} reps.
        Be encouraging, professional, and concise. Do not use markdown.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { temperature: 0.7 }
        });
        return response.text || "Keep pushing forward! Consistency is key to recovery.";
    } catch (error) {
        return "Recovery takes time, but every rep counts. You're doing great!";
    }
};

export const generateDischargeReport = async (patient: Patient): Promise<string> => {
    const ai = getClient();
    
    // Safe access to last log
    const lastLog = patient.logs.length > 0 ? patient.logs[patient.logs.length - 1] : null;
    const finalRom = lastLog ? lastLog.maxRom : 0;
    const finalPain = lastLog ? lastLog.painScore : 0;

    const prompt = `
        Draft a compassionate and professional discharge summary email for ${patient.name}.
        Email Subject: Recovery Journey Completion - ${patient.injury}
        
        Details:
        - Patient: ${patient.name}
        - Injury: ${patient.injury}
        - Sessions Logged: ${patient.logs.length}
        - Final ROM: ${finalRom}°
        - Final Pain: ${finalPain}/10
        
        The email should congratulate them on completing their prescribed protocol and instruct them that their temporary data logs are now being securely wiped from the active device storage.
        Do not use markdown formatting.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { temperature: 0.7 }
        });
        return response.text || "Discharge summary generated.";
    } catch (error) {
        return "Error generating discharge report.";
    }
};

export const analyzeVoiceNote = async (base64Audio: string): Promise<string> => {
    const ai = getClient();
    
    // Remove data URL prefix if present (e.g., "data:audio/webm;base64,")
    const cleanBase64 = base64Audio.replace(/^data:audio\/\w+;base64,/, "");

    const prompt = `
        You are listening to a voice note from a physiotherapy patient after their exercise session.
        1. Transcribe the audio exactly.
        2. Extract any keywords related to pain (e.g., "sharp", "dull", "hurts"), fatigue, or difficulty.
        3. Determine the sentiment (Positive/Negative/Neutral).
        
        Format as: "Transcription: [text] | Keywords: [list]"
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: "audio/webm",
                            data: cleanBase64
                        }
                    },
                    { text: prompt }
                ]
            }
        });
        return response.text || "Audio analysis unavailable.";
    } catch (error) {
        console.error("Gemini Audio Error:", error);
        return "Error analyzing voice note.";
    }
};