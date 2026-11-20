import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorNote } from "@/components/feedback";
import { confirmPhone, enableRole } from "@/data/actions";
import { useApp } from "@/data/context";
import { DEMO_OTP_CODE, requestOtpStub } from "@/adapters/otp";
import { legalQuestions, productQuestions } from "@/content/open-questions";
import { useI18n } from "@/i18n/context";
import { fill } from "@/i18n/messages";
import { navigate } from "@/router";

export function SafetyPage() {
  const { messages } = useI18n();
  return (
    <article className="max-w-2xl">
      <h1 className="font-heading text-4xl">{messages.safety.title}</h1>
      <ul className="mt-4 grid gap-3">
        {messages.safety.points.map((point) => (
          <li key={point} className="rounded-xl bg-card p-4 text-sm ring-1 ring-foreground/10">{point}</li>
        ))}
      </ul>
    </article>
  );
}

export function LegalPage({ kind }: { kind: "terms" | "privacy" }) {
  const { messages } = useI18n();
  const title = kind === "terms" ? messages.legal.termsTitle : messages.legal.privacyTitle;
  const paragraphs = kind === "terms" ? messages.legal.terms : messages.legal.privacy;
  return (
    <article className="max-w-2xl">
      <p className="text-sm font-medium text-primary">{messages.legal.draft}</p>
      <h1 className="mt-2 font-heading text-4xl">{title}</h1>
      <div className="mt-4 grid gap-3 text-sm leading-6">
        {paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}

export function QuestionsPage() {
  const { messages } = useI18n();
  return (
    <article className="max-w-2xl">
      <h1 className="font-heading text-4xl">{messages.questions.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{messages.questions.lede}</p>
      <h2 className="mt-6 font-heading text-2xl">Legal</h2>
      <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm">
        {legalQuestions.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>
      <h2 className="mt-6 font-heading text-2xl">Product</h2>
      <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm">
        {productQuestions.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>
    </article>
  );
}

export function AccountPage() {
  const { messages } = useI18n();
  const { user, run } = useApp();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  if (!user) return <Button type="button" className="h-11" onClick={() => navigate("/login")}>{messages.nav.login}</Button>;
  const stub = requestOtpStub(user.phone);
  return (
    <div className="grid max-w-xl gap-4">
      <h1 className="font-heading text-4xl">{messages.account.title}</h1>
      <p className="text-sm">{user.name}<br />{user.email}<br />{user.phone}</p>
      <section className="rounded-2xl bg-[#f6f1e7] p-4 text-sm">
        <h2 className="font-heading text-2xl">{messages.account.phoneTitle}</h2>
        <p className="mt-2">{fill(messages.account.phoneBody, { code: DEMO_OTP_CODE })}</p>
        <p className="mt-1 text-muted-foreground">{stub.channel}: {stub.demoCode}</p>
        {user.phoneDemoConfirmed ? (
          <p className="mt-3">{messages.account.confirmed}</p>
        ) : (
          <form
            className="mt-3 grid gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              setError(run((current) => confirmPhone(current, user.id, code)));
            }}
          >
            <Label htmlFor="otp">{messages.account.code}</Label>
            <Input id="otp" className="h-11" value={code} onChange={(event) => setCode(event.target.value)} />
            <ErrorNote code={error} />
            <Button type="submit" className="h-10 w-fit">{messages.account.confirm}</Button>
          </form>
        )}
      </section>
      <section>
        <h2 className="font-heading text-2xl">{messages.account.roles}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {user.isPassenger ? "passenger" : ""} {user.isDriver ? "driver" : ""} {user.isAdmin ? "admin" : ""}
        </p>
        {!user.isPassenger && (
          <Button type="button" className="mt-3 h-10" onClick={() => run((current) => enableRole(current, user.id, "passenger"))}>
            {messages.account.addPassenger}
          </Button>
        )}
      </section>
    </div>
  );
}
