import { useEffect, useState } from "react";
import { Shell } from "@/components/shell";
import { StoreProvider } from "@/data/context";
import { I18nProvider } from "@/i18n/context";
import { useI18n } from "@/i18n/context";
import { parseHash, type AppLocation } from "@/router";
import { AccountPage, LegalPage, QuestionsPage, SafetyPage } from "@/pages/info";
import { AdminPage } from "@/pages/admin";
import { LoginPage, RegisterPage } from "@/pages/auth";
import { DrivePage } from "@/pages/drive";
import { HomePage } from "@/pages/home";
import { PostPage } from "@/pages/post";
import { RidePage } from "@/pages/ride";
import { SearchPage } from "@/pages/search";
import { TripsPage } from "@/pages/trips";

function useHashLocation(): AppLocation {
  const [location, setLocation] = useState(() => parseHash(window.location.hash));
  useEffect(() => {
    const sync = () => setLocation(parseHash(window.location.hash));
    if (!window.location.hash) {
      window.location.replace(`${window.location.pathname}${window.location.search}#/`);
    }
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  return location;
}

function Screen({ location }: { location: AppLocation }) {
  const { messages } = useI18n();
  const { path } = location;
  if (path === "/") return <HomePage />;
  if (path === "/rides") return <SearchPage location={location} />;
  if (path === "/rides/new") return <PostPage />;
  if (path.startsWith("/rides/")) return <RidePage id={decodeURIComponent(path.slice("/rides/".length))} />;
  if (path === "/login") return <LoginPage />;
  if (path === "/register") return <RegisterPage />;
  if (path === "/drive") return <DrivePage />;
  if (path === "/trips") return <TripsPage />;
  if (path === "/admin") return <AdminPage />;
  if (path === "/account") return <AccountPage />;
  if (path === "/safety") return <SafetyPage />;
  if (path === "/legal/terms") return <LegalPage kind="terms" />;
  if (path === "/legal/privacy") return <LegalPage kind="privacy" />;
  if (path === "/questions") return <QuestionsPage />;
  return (
    <div>
      <h1 className="font-heading text-4xl">{messages.errors.NOT_FOUND}</h1>
    </div>
  );
}

function Frame() {
  const location = useHashLocation();
  return (
    <Shell path={location.path}>
      <Screen location={location} />
    </Shell>
  );
}

export function App() {
  return (
    <StoreProvider>
      <I18nProvider>
        <Frame />
      </I18nProvider>
    </StoreProvider>
  );
}
