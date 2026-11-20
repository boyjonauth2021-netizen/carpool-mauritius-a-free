import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorNote } from "@/components/feedback";
import { login, register } from "@/data/actions";
import { useApp } from "@/data/context";
import { useI18n } from "@/i18n/context";
import { fill } from "@/i18n/messages";
import { DEMO_ACCOUNTS } from "@/data/seed";
import { navigate } from "@/router";

export function LoginPage() {
  const { messages } = useI18n();
  const { run } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function enter(nextEmail: string, nextPassword: string, to = "/trips") {
    const code = run((state) => login(state, nextEmail, nextPassword));
    setError(code);
    if (!code) navigate(to);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <form
        className="grid max-w-md gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          enter(email, password);
        }}
      >
        <h1 className="font-heading text-4xl">{messages.auth.loginTitle}</h1>
        <label className="grid gap-1.5">
          <Label htmlFor="email">{messages.auth.email}</Label>
          <Input id="email" type="email" className="h-11" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor="password">{messages.auth.password}</Label>
          <Input id="password" type="password" className="h-11" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </label>
        <ErrorNote code={error} />
        <Button type="submit" className="h-11">{messages.auth.submitLogin}</Button>
        <button type="button" className="text-left text-sm underline" onClick={() => navigate("/register")}>{messages.auth.noAccount}</button>
      </form>
      <section className="rounded-2xl bg-[#f6f1e7] p-4">
        <h2 className="font-heading text-2xl">{messages.auth.demoTitle}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{messages.auth.demoNote}</p>
        <ul className="mt-4 grid gap-2">
          {Object.entries(DEMO_ACCOUNTS).map(([key, account]) => (
            <li key={key} className="rounded-xl bg-card p-3 text-sm">
              <p className="font-medium">{account.name}</p>
              <p className="text-muted-foreground">{account.email}</p>
              <p className="text-muted-foreground">{account.password}</p>
              <Button
                type="button"
                className="mt-2 h-9"
                onClick={() => enter(account.email, account.password, key === "admin" ? "/admin" : key === "pending" ? "/drive" : "/trips")}
              >
                {fill(messages.auth.use, { name: account.name })}
              </Button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function RegisterPage() {
  const { locale, messages } = useI18n();
  const { run } = useApp();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [isPassenger, setIsPassenger] = useState(true);
  const [isDriver, setIsDriver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="grid max-w-md gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        const code = run((state) => register(state, { name, email, password, phone, isPassenger, isDriver, locale }, new Date()));
        setError(code);
        if (!code) navigate(isDriver ? "/drive" : "/");
      }}
    >
      <h1 className="font-heading text-4xl">{messages.auth.registerTitle}</h1>
      <label className="grid gap-1.5">
        <Label htmlFor="name">{messages.auth.name}</Label>
        <Input id="name" className="h-11" value={name} onChange={(event) => setName(event.target.value)} required />
      </label>
      <label className="grid gap-1.5">
        <Label htmlFor="reg-email">{messages.auth.email}</Label>
        <Input id="reg-email" type="email" className="h-11" value={email} onChange={(event) => setEmail(event.target.value)} required />
      </label>
      <label className="grid gap-1.5">
        <Label htmlFor="reg-phone">{messages.auth.phone}</Label>
        <Input id="reg-phone" className="h-11" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="5712 3344" required />
      </label>
      <label className="grid gap-1.5">
        <Label htmlFor="reg-password">{messages.auth.password}</Label>
        <Input id="reg-password" type="password" className="h-11" value={password} onChange={(event) => setPassword(event.target.value)} required />
        <span className="text-xs text-muted-foreground">{messages.auth.passwordHint}</span>
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isPassenger} onChange={(event) => setIsPassenger(event.target.checked)} />
        {messages.auth.passenger}
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isDriver} onChange={(event) => setIsDriver(event.target.checked)} />
        {messages.auth.driver}
      </label>
      <ErrorNote code={error} />
      <Button type="submit" className="h-11">{messages.auth.submitRegister}</Button>
      <button type="button" className="text-left text-sm underline" onClick={() => navigate("/login")}>{messages.auth.haveAccount}</button>
    </form>
  );
}
