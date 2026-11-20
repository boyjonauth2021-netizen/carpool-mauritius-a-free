export const DEMO_OTP_CODE = "000000";

export type OtpStubResult = {
  delivered: false;
  channel: "stub";
  phone: string;
  demoCode: typeof DEMO_OTP_CODE;
};

/** No SMS is sent. The demo code is shown on screen because nothing else can deliver it. */
export function requestOtpStub(phone: string): OtpStubResult {
  return { delivered: false, channel: "stub", phone, demoCode: DEMO_OTP_CODE };
}

export function verifyOtpStub(code: string): boolean {
  return code.trim() === DEMO_OTP_CODE;
}
