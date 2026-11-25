/**
 * Twilio SMS channel — sends "order ready" SMS to customer
 */

export type TwilioResult = {
  success: boolean;
  sid?: string;
  error?: string;
};

export async function sendSms(params: {
  to: string;
  message: string;
}): Promise<TwilioResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_MESSAGING_FROM;

  if (!accountSid || !authToken || !from) {
    console.warn("Twilio env vars not set — skipping SMS");
    return { success: false, error: "Twilio not configured" };
  }

  // Validate E.164 phone format
  const phone = params.to.trim();
  if (!phone.startsWith("+") || phone.length < 8) {
    return { success: false, error: "Invalid phone number format (must be E.164)" };
  }

  try {
    const credentials = btoa(`${accountSid}:${authToken}`);
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    const body = new URLSearchParams({
      To: phone,
      From: from,
      Body: params.message,
    });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Twilio SMS error:", data);
      return {
        success: false,
        error: data.message || `HTTP ${response.status}`,
      };
    }

    return {
      success: true,
      sid: data.sid,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Twilio SMS exception:", msg);
    return { success: false, error: msg };
  }
}
