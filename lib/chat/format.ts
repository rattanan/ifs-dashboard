export const AUTHORIZED_DATA_FOOTER = "Based on currently available and authorized data";

const legacyFooter = /^(?:คำเตือน[:：]?\s*)?(?:โปรด(?:เปิด|ตรวจสอบ).*Card.*|ตัวเลขข้างต้น.*Card.*|Based on currently available and authorized data)$/i;

export function finalizeChatAnswer(answer: string) {
  const lines = answer.trim().split("\n");
  while (lines.length && legacyFooter.test(lines.at(-1)?.trim() ?? "")) lines.pop();
  return `${lines.join("\n").trim()}\n\n${AUTHORIZED_DATA_FOOTER}`;
}
