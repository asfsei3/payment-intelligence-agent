import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-gold-500/10 bg-ink-950/70 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 md:px-8 py-3">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-gold-400 to-gold-500 text-ink-950 font-bold text-sm shadow-glow">
            P
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-moss-100">
              Payment Intelligence Agent
            </span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-gold-400/70">
              AI Revenue Ops Desk
            </span>
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-1 text-sm">
          <Link href="/upload" className="btn-ghost">
            アップロード
          </Link>
          <Link
            href="/upload?sample=1"
            className="btn-secondary text-xs px-3 py-1.5"
          >
            サンプルCSVでデモ
          </Link>
        </nav>
      </div>
    </header>
  );
}
