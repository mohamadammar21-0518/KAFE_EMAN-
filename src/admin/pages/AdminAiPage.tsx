import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAdminToken } from "@/admin/useAdminToken";
import {
  Phone, MessageSquare, CheckCircle2, XCircle,
  Loader2, Settings, PhoneCall, Wifi, WifiOff,
  Info, Copy, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TestResult = {
  success: boolean;
  channel: "call" | "sms";
  provider: "vapi" | "twilio";
  error?: string;
  callId?: string;
  sid?: string;
  phoneNumber: string;
  message: string;
};

type IntegrationStatus = {
  vapi: { apiKey: boolean; phoneNumberId: boolean; assistantId: boolean; configured: boolean };
  twilio: { accountSid: boolean; authToken: boolean; fromNumber: boolean; configured: boolean };
  groq: { apiKey: boolean; model: string; configured: boolean };
} | null;

export function AdminAiPage() {
  const adminToken = useAdminToken();

  // Actions
  const checkStatus = useAction(api.ai.testVapi.getIntegrationStatus);
  const testCall = useAction(api.ai.testVapi.testVapiCall);
  const testSms = useAction(api.ai.testVapi.testTwilioSms);

  // State
  const [status, setStatus] = useState<IntegrationStatus>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const [callPhone, setCallPhone] = useState("");
  const [callMessage, setCallMessage] = useState("");
  const [callLoading, setCallLoading] = useState(false);
  const [callResult, setCallResult] = useState<TestResult | null>(null);

  const [smsPhone, setSmsPhone] = useState("");
  const [smsMessage, setSmsMessage] = useState("");
  const [smsLoading, setSmsLoading] = useState(false);
  const [smsResult, setSmsResult] = useState<TestResult | null>(null);

  const [copied, setCopied] = useState(false);

  async function handleCheckStatus() {
    if (!adminToken) return;
    setStatusLoading(true);
    try {
      const result = await checkStatus({ adminToken });
      setStatus(result);
    } catch (e) {
      console.error(e);
    } finally {
      setStatusLoading(false);
    }
  }

  async function handleTestCall(e: React.FormEvent) {
    e.preventDefault();
    if (!adminToken || !callPhone.trim()) return;
    setCallLoading(true);
    setCallResult(null);
    try {
      const result = await testCall({
        adminToken,
        phoneNumber: callPhone.trim(),
        message: callMessage.trim() || undefined,
        customerName: "Test User",
      });
      setCallResult(result);
    } catch (err) {
      setCallResult({
        success: false,
        channel: "call",
        provider: "vapi",
        error: err instanceof Error ? err.message : "Unknown error",
        phoneNumber: callPhone,
        message: callMessage,
      });
    } finally {
      setCallLoading(false);
    }
  }

  async function handleTestSms(e: React.FormEvent) {
    e.preventDefault();
    if (!adminToken || !smsPhone.trim()) return;
    setSmsLoading(true);
    setSmsResult(null);
    try {
      const result = await testSms({
        adminToken,
        phoneNumber: smsPhone.trim(),
        message: smsMessage.trim() || undefined,
      });
      setSmsResult(result);
    } catch (err) {
      setSmsResult({
        success: false,
        channel: "sms",
        provider: "twilio",
        error: err instanceof Error ? err.message : "Unknown error",
        phoneNumber: smsPhone,
        message: smsMessage,
      });
    } finally {
      setSmsLoading(false);
    }
  }

  function copyEnvCommand(vars: string) {
    navigator.clipboard.writeText(vars);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const vapiEnvCmd = `bunx convex env set VAPI_API_KEY your_vapi_key\nbunx convex env set VAPI_PHONE_NUMBER_ID your_phone_number_id\nbunx convex env set VAPI_ASSISTANT_ID your_assistant_id  # optional`;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Settings className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-coffee-dark">AI Integrations</h1>
          <p className="text-sm text-muted">Test Vapi voice calls, Twilio SMS, and check credential status</p>
        </div>
      </div>

      {/* ── Integration Status ── */}
      <section className="rounded-2xl border border-outline/30 bg-white p-5 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-coffee-dark">Integration Status</h2>
          <button
            type="button"
            onClick={handleCheckStatus}
            disabled={statusLoading}
            className="flex items-center gap-1.5 rounded-full border border-outline/40 bg-surface px-3 py-1.5 text-xs font-medium text-on-surface transition-colors hover:bg-primary/8 hover:text-primary disabled:opacity-50"
          >
            {statusLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wifi className="h-3 w-3" />}
            {statusLoading ? "Checking…" : "Check status"}
          </button>
        </div>

        {!status && !statusLoading && (
          <p className="mt-4 text-sm text-muted">Click "Check status" to verify your credentials.</p>
        )}

        {status && (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <StatusCard
              name="Vapi AI"
              icon={<PhoneCall className="h-4 w-4" />}
              configured={status.vapi.configured}
              items={[
                { label: "API Key", set: status.vapi.apiKey },
                { label: "Phone Number ID", set: status.vapi.phoneNumberId },
                { label: "Assistant ID", set: status.vapi.assistantId, optional: true },
              ]}
            />
            <StatusCard
              name="Twilio SMS"
              icon={<MessageSquare className="h-4 w-4" />}
              configured={status.twilio.configured}
              items={[
                { label: "Account SID", set: status.twilio.accountSid },
                { label: "Auth Token", set: status.twilio.authToken },
                { label: "From Number", set: status.twilio.fromNumber },
              ]}
            />
            <StatusCard
              name="GROQ AI"
              icon={<Wifi className="h-4 w-4" />}
              configured={status.groq.configured}
              items={[
                { label: "API Key", set: status.groq.apiKey },
                { label: `Model: ${status.groq.model}`, set: true, optional: true },
              ]}
            />
          </div>
        )}
      </section>

      {/* ── Vapi Setup Guide ── */}
      <section className="rounded-2xl border border-outline/30 bg-white p-5 shadow-soft">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50">
            <Info className="h-4 w-4 text-blue-500" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-coffee-dark">Vapi Setup Guide</h2>
            <ol className="mt-3 space-y-2 text-sm text-muted">
              <li className="flex gap-2"><span className="font-semibold text-primary">1.</span> Sign up at <a href="https://vapi.ai" target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">vapi.ai</a></li>
              <li className="flex gap-2"><span className="font-semibold text-primary">2.</span> Go to <strong>Phone Numbers</strong> → Buy or import a number → copy the <strong>Phone Number ID</strong></li>
              <li className="flex gap-2"><span className="font-semibold text-primary">3.</span> Go to <strong>API Keys</strong> → Create a key → copy it</li>
              <li className="flex gap-2"><span className="font-semibold text-primary">4.</span> (Optional) Go to <strong>Assistants</strong> → Create one → copy the <strong>Assistant ID</strong></li>
              <li className="flex gap-2"><span className="font-semibold text-primary">5.</span> Run these commands in your terminal:</li>
            </ol>

            <div className="mt-3 rounded-xl bg-coffee-dark p-3.5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] text-white/40 font-mono">Terminal</span>
                <button
                  type="button"
                  onClick={() => copyEnvCommand(vapiEnvCmd)}
                  className="flex items-center gap-1 text-[11px] text-white/50 hover:text-white transition-colors"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <pre className="text-[12px] text-green-400 font-mono whitespace-pre-wrap leading-relaxed">
                {vapiEnvCmd}
              </pre>
            </div>

            <p className="mt-2.5 text-xs text-muted">
              After setting env vars, run <code className="rounded bg-gray-100 px-1 py-0.5 text-[11px] font-mono">bunx convex dev --once</code> to deploy.
            </p>
          </div>
        </div>
      </section>

      {/* ── Test Vapi Call ── */}
      <section className="rounded-2xl border border-outline/30 bg-white p-5 shadow-soft">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50">
            <PhoneCall className="h-4.5 w-4.5 text-violet-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-coffee-dark">Test Vapi Voice Call</h2>
            <p className="text-xs text-muted">Places a real outbound call to verify Vapi is working</p>
          </div>
        </div>

        <form onSubmit={handleTestCall} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-on-surface">
              Phone number <span className="text-muted">(E.164 format, e.g. +601112345678)</span>
            </label>
            <input
              type="tel"
              value={callPhone}
              onChange={(e) => setCallPhone(e.target.value)}
              placeholder="+601112345678"
              required
              className="w-full rounded-xl border border-outline/40 bg-surface px-3.5 py-2.5 text-sm text-on-surface placeholder:text-muted/50 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-on-surface">
              Custom message <span className="text-muted">(optional — leave blank for default)</span>
            </label>
            <textarea
              value={callMessage}
              onChange={(e) => setCallMessage(e.target.value)}
              placeholder="Hello! This is a test call from Kafe Eman…"
              rows={2}
              className="w-full resize-none rounded-xl border border-outline/40 bg-surface px-3.5 py-2.5 text-sm text-on-surface placeholder:text-muted/50 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10"
            />
          </div>

          <button
            type="submit"
            disabled={callLoading || !callPhone.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {callLoading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Calling…</>
            ) : (
              <><Phone className="h-4 w-4" /> Place Test Call</>
            )}
          </button>
        </form>

        {callResult && <TestResultBanner result={callResult} />}
      </section>

      {/* ── Test Twilio SMS ── */}
      <section className="rounded-2xl border border-outline/30 bg-white p-5 shadow-soft">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
            <MessageSquare className="h-4.5 w-4.5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-coffee-dark">Test Twilio SMS</h2>
            <p className="text-xs text-muted">Sends a real SMS to verify Twilio is working</p>
          </div>
        </div>

        <form onSubmit={handleTestSms} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-on-surface">
              Phone number <span className="text-muted">(E.164 format)</span>
            </label>
            <input
              type="tel"
              value={smsPhone}
              onChange={(e) => setSmsPhone(e.target.value)}
              placeholder="+601112345678"
              required
              className="w-full rounded-xl border border-outline/40 bg-surface px-3.5 py-2.5 text-sm text-on-surface placeholder:text-muted/50 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-on-surface">
              Custom message <span className="text-muted">(optional)</span>
            </label>
            <textarea
              value={smsMessage}
              onChange={(e) => setSmsMessage(e.target.value)}
              placeholder="Hello from Kafe Eman! Your SMS system is working…"
              rows={2}
              className="w-full resize-none rounded-xl border border-outline/40 bg-surface px-3.5 py-2.5 text-sm text-on-surface placeholder:text-muted/50 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10"
            />
          </div>

          <button
            type="submit"
            disabled={smsLoading || !smsPhone.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {smsLoading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
            ) : (
              <><MessageSquare className="h-4 w-4" /> Send Test SMS</>
            )}
          </button>
        </form>

        {smsResult && <TestResultBanner result={smsResult} />}
      </section>

      {/* ── How it works ── */}
      <section className="rounded-2xl border border-outline/30 bg-white p-5 shadow-soft">
        <h2 className="text-sm font-semibold text-coffee-dark mb-3">How it works in production</h2>
        <div className="space-y-2">
          {[
            { step: "1", label: "Customer places an order", detail: "Order is saved with status: pending" },
            { step: "2", label: "Admin accepts the order", detail: "Status → confirmed. GROQ analyzes the order and stores prep notes." },
            { step: "3", label: "Admin marks order as Ready", detail: "Status → ready. Vapi call and/or Twilio SMS fires automatically." },
            { step: "4", label: "Customer is notified", detail: "They receive a personalized AI-written message to come pick up their order." },
          ].map((item) => (
            <div key={item.step} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                {item.step}
              </span>
              <div>
                <p className="text-sm font-medium text-on-surface">{item.label}</p>
                <p className="text-xs text-muted">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ── Sub-components ── */

function StatusCard({
  name, icon, configured, items,
}: {
  name: string;
  icon: React.ReactNode;
  configured: boolean;
  items: { label: string; set: boolean; optional?: boolean }[];
}) {
  return (
    <div className={cn(
      "rounded-xl border p-3.5",
      configured ? "border-emerald-200 bg-emerald-50/50" : "border-orange-200 bg-orange-50/50"
    )}>
      <div className="flex items-center gap-2 mb-2.5">
        <span className={cn("flex h-7 w-7 items-center justify-center rounded-full",
          configured ? "bg-emerald-100 text-emerald-600" : "bg-orange-100 text-orange-600"
        )}>{icon}</span>
        <span className="text-sm font-semibold text-coffee-dark">{name}</span>
        {configured
          ? <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-500" />
          : <WifiOff className="ml-auto h-4 w-4 text-orange-400" />
        }
      </div>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-1.5 text-[11px]">
            {item.set
              ? <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
              : item.optional
                ? <span className="h-3 w-3 shrink-0 text-center text-gray-300">–</span>
                : <XCircle className="h-3 w-3 text-orange-400 shrink-0" />
            }
            <span className={item.set ? "text-on-surface" : item.optional ? "text-muted" : "text-orange-600"}>
              {item.label} {item.optional && !item.set ? "(optional)" : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TestResultBanner({ result }: { result: TestResult }) {
  return (
    <div className={cn(
      "mt-4 rounded-xl border p-4",
      result.success
        ? "border-emerald-200 bg-emerald-50"
        : "border-red-200 bg-red-50"
    )}>
      <div className="flex items-center gap-2 mb-2">
        {result.success
          ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          : <XCircle className="h-5 w-5 text-red-400" />
        }
        <p className={cn("text-sm font-semibold", result.success ? "text-emerald-700" : "text-red-600")}>
          {result.success
            ? result.channel === "call" ? "Call placed successfully!" : "SMS sent successfully!"
            : result.channel === "call" ? "Call failed" : "SMS failed"
          }
        </p>
      </div>
      <dl className="space-y-1 text-xs text-muted">
        <div className="flex gap-2">
          <dt className="font-medium text-on-surface w-20 shrink-0">To:</dt>
          <dd>{result.phoneNumber}</dd>
        </div>
        {result.callId && (
          <div className="flex gap-2">
            <dt className="font-medium text-on-surface w-20 shrink-0">Call ID:</dt>
            <dd className="font-mono break-all">{result.callId}</dd>
          </div>
        )}
        {result.sid && (
          <div className="flex gap-2">
            <dt className="font-medium text-on-surface w-20 shrink-0">SMS SID:</dt>
            <dd className="font-mono break-all">{result.sid}</dd>
          </div>
        )}
        {result.error && (
          <div className="flex gap-2">
            <dt className="font-medium text-red-600 w-20 shrink-0">Error:</dt>
            <dd className="text-red-600">{result.error}</dd>
          </div>
        )}
        <div className="flex gap-2">
          <dt className="font-medium text-on-surface w-20 shrink-0">Message:</dt>
          <dd className="italic">"{result.message}"</dd>
        </div>
      </dl>
    </div>
  );
}
