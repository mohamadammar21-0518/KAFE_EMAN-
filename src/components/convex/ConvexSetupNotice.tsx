export function ConvexSetupNotice({ context }: { context: string }) {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
      <p className="font-semibold">Convex backend not connected</p>
      <p className="mt-2 text-amber-900/90">
        {context} requires a Convex deployment. In the project folder run{" "}
        <code className="rounded bg-white/80 px-1.5 py-0.5">npx convex dev</code>, copy the URL into{" "}
        <code className="rounded bg-white/80 px-1.5 py-0.5">VITE_CONVEX_URL</code> in{" "}
        <code className="rounded bg-white/80 px-1.5 py-0.5">.env</code>, then run{" "}
        <code className="rounded bg-white/80 px-1.5 py-0.5">npx convex run seed:seed</code>.
      </p>
    </div>
  );
}
