/**
 * VAPI voice call channel — places outbound call to customer when order is ready
 */

export type VapiResult = {
  success: boolean;
  callId?: string;
  error?: string;
};

export async function placeCall(params: {
  to: string;
  message: string;
  customerName: string;
}): Promise<VapiResult> {
  const apiKey = process.env.VAPI_API_KEY;
  const phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;
  const assistantId = process.env.VAPI_ASSISTANT_ID;

  if (!apiKey || !phoneNumberId) {
    console.warn("VAPI env vars not set — skipping voice call");
    return { success: false, error: "VAPI not configured" };
  }

  // Validate E.164 phone format
  const phone = params.to.trim();
  if (!phone.startsWith("+") || phone.length < 8) {
    return { success: false, error: "Invalid phone number format (must be E.164)" };
  }

  try {
    // Build the call payload
    const payload: Record<string, unknown> = {
      phoneNumberId,
      customer: {
        number: phone,
        name: params.customerName,
      },
    };

    if (assistantId) {
      // Use pre-configured assistant
      payload.assistantId = assistantId;
      payload.assistantOverrides = {
        firstMessage: params.message,
      };
    } else {
      // Use inline assistant with TTS
      payload.assistant = {
        firstMessage: params.message,
        model: {
          provider: "groq",
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: `You are a friendly notification assistant for Kafe Eman café. 
Your only job is to inform the customer that their order is ready for pickup.
Be brief, warm, and professional. After delivering the message, say goodbye.`,
            },
          ],
        },
        voice: {
          provider: "playht",
          voiceId: "jennifer",
        },
        endCallMessage: "Thank you and have a great day!",
        endCallPhrases: ["goodbye", "bye", "thank you"],
      };
    }

    const response = await fetch("https://api.vapi.ai/call", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("VAPI call error:", data);
      return {
        success: false,
        error: data.message || `HTTP ${response.status}`,
      };
    }

    return {
      success: true,
      callId: data.id,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("VAPI call exception:", msg);
    return { success: false, error: msg };
  }
}
