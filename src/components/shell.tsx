import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { logout } from "@/data/actions";
import { useApp } from "@/data/context";
import { useI18n } from "@/i18n/context";
import { navigate } from "@/router";

function go(event: React.MouseEvent<HTMLAnchorElement>, to: string) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
  event.preventDefault();
  navigate(to);
}

export function Shell({ path, children }: { path: string; children: ReactNode }) {
  const { messages, locale, setLocale } = useI18n();
  const { user, state, run, resetDemo } = useApp();
  const unread = state.notifications.filter((item) => item.userId === user?.id && !item.readAt).length;
  const links = [
    { to: "/", label: messages.nav.find },
    { to: "/rides/new", label: messages.nav.post },
    { to: "/trips", label: messages.nav.trips },
    { to: "/drive", label: messages.nav.drive },
    { to: "/safety", label: messages.nav.safety },
  ];

  return (
    <div className="min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-card focus:p-2">
        {messages.nav.find}
      </a>
      <header className="sticky top-0 z-40 border-b border-border/80 bg-[#fffcf7]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <a href="#/" onClick={(event) => go(event, "/")} className="leading-tight">
            <span className="block font-heading text-xl text-[#0e3f3c]">{messages.brand}</span>
            <span className="text-xs tracking-wide text-muted-foreground">{messages.byline}</span>
          </a>
          <nav className="hidden items-center gap-4 md:flex">
            {links.map((link) => (
              <a
                key={link.to}
                href={`#${link.to}`}
                onClick={(event) => go(event, link.to)}
                className={path === link.to ? "text-sm font-semibold text-primary" : "text-sm text-foreground/80"}
              >
                {link.label}
              </a>
            ))}
            {user?.isAdmin && (
              <a href="#/admin" onClick={(event) => go(event, "/admin")} className="text-sm font-semibold">
                {messages.nav.admin}
              </a>
            )}
          </nav>
          <div className="flex items-center gap-2">
            <div className="flex rounded-full bg-muted p-0.5 text-xs">
              {(["en", "fr"] as const).map((code) => (
                <button
                  key={code}
                  type="button"
                  className={locale === code ? "rounded-full bg-card px-2 py-1 font-semibold" : "px-2 py-1 text-muted-foreground"}
                  onClick={() => {
                    setLocale(code);
                    if (user) run((current) => ({ ...current, users: current.users.map((item) => item.id === user.id ? { ...item, locale: code } : item) }));
                  }}
                >
                  {code.toUpperCase()}
                </button>
              ))}
            </div>
            {user ? (
              <>
                <a href="#/account" onClick={(event) => go(event, "/account")} className="hidden text-sm sm:inline">
                  {user.name.split(" ")[0]}
                  {unread > 0 ? ` (${unread})` : ""}
                </a>
                <Button
                  variant="outline"
                  className="h-8"
                  type="button"
                  onClick={() => {
                    run(logout);
                    navigate("/");
                  }}
                >
                  {messages.nav.logout}
                </Button>
              </>
            ) : (
              <Button className="h-8" type="button" onClick={() => navigate("/login")}>
                {messages.nav.login}
              </Button>
            )}
          </div>
        </div>
        <nav className="flex gap-3 overflow-x-auto px-4 pb-3 text-sm md:hidden">
          {links.map((link) => (
            <a key={link.to} href={`#${link.to}`} onClick={(event) => go(event, link.to)} className="shrink-0">
              {link.label}
            </a>
          ))}
          {user?.isAdmin && (
            <a href="#/admin" onClick={(event) => go(event, "/admin")} className="shrink-0">
              {messages.nav.admin}
            </a>
          )}
        </nav>
      </header>
      <p className="bg-[#0e3f3c] px-4 py-2 text-center text-xs text-[#f6f1e7]">{messages.demoBanner}</p>
      <main id="main" className="mx-auto max-w-6xl px-4 py-8">
        {children}
      </main>
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>
            © 2026 {messages.byline}. {messages.footer.model}
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="#/legal/terms" onClick={(event) => go(event, "/legal/terms")}>{messages.footer.terms}</a>
            <a href="#/legal/privacy" onClick={(event) => go(event, "/legal/privacy")}>{messages.footer.privacy}</a>
            <a href="#/questions" onClick={(event) => go(event, "/questions")}>{messages.footer.questions}</a>
            <button
              type="button"
              className="underline"
              onClick={() => {
                resetDemo();
                navigate("/");
              }}
            >
              {messages.footer.reset}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
