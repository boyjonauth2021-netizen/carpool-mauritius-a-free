import { fill } from "@/i18n/messages";
import { useI18n } from "@/i18n/context";

export function ErrorNote({ code }: { code: string | null }) {
  const { messages } = useI18n();
  if (!code) return null;
  const text = messages.errors[code as keyof typeof messages.errors] ?? code;
  return (
    <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {text}
    </p>
  );
}

export function Notice({ text }: { text: string | null }) {
  if (!text) return null;
  return <p className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">{text}</p>;
}

export function statusLabel(messages: { status: Record<string, string> }, status: string): string {
  return messages.status[status] ?? status;
}

export function interpolate(template: string, params?: Record<string, string | number>): string {
  return fill(template, params);
}
