const SIMPLE_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validasi input email tujuan opsional (kosong = pakai default .env di server,
 * atau satu/beberapa alamat email dipisahkan koma).
 */
export function validateOptionalEmailInput(raw) {
  const trimmed = String(raw || "").trim();
  if (!trimmed) {
    return { valid: true, value: "", error: "" };
  }

  const recipients = trimmed
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (
    recipients.length === 0 ||
    recipients.some((item) => !SIMPLE_EMAIL_REGEX.test(item))
  ) {
    return {
      valid: false,
      value: trimmed,
      error:
        "Format email tidak valid. Pisahkan dengan koma jika lebih dari satu.",
    };
  }

  return { valid: true, value: recipients.join(", "), error: "" };
}
