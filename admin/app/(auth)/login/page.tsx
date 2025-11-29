import { LoginForm } from "@/features/auth/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-app text-[--color-foreground] md:flex-row">
      <section className="flex flex-1 flex-col justify-center gap-8 p-10">
        <p className="text-sm uppercase tracking-[0.4em] text-[--color-mutedForeground]">
          AICRYPTOBOT COMMAND
        </p>
        <div>
          <h1 className="text-5xl font-semibold leading-tight text-gradient">
            Operate the future of AI crypto intelligence.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-[--color-mutedForeground]">
            Monitor capital inflows, investments, team health, wallet liquidity, and automation jobs —
            all from one secure control room.
          </p>
        </div>
        <div className="grid-auto-fit">
          <div className="card-surface">
            <p className="text-sm text-[--color-mutedForeground]">Network capital</p>
            <p className="text-3xl font-semibold">$8.4M</p>
          </div>
          <div className="card-surface">
            <p className="text-sm text-[--color-mutedForeground]">Daily ROI cycle</p>
            <p className="text-3xl font-semibold">+3.8%</p>
          </div>
        </div>
      </section>

      <section className="flex w-full max-w-xl flex-col justify-center gap-8 border-t border-white/10 bg-black/20 p-8 backdrop-blur md:min-h-screen md:border-l md:border-t-0">
        <div>
          <p className="text-sm text-[--color-mutedForeground]">Secure login</p>
          <h2 className="text-3xl font-semibold text-[--color-foreground]">Enter mission console</h2>
        </div>
        <LoginForm />
        <p className="text-xs text-[--color-mutedForeground]">
          Protected by multi-layer auth, device fingerprinting, & audit logging.
        </p>
      </section>
    </div>
  );
}




