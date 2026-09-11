export function normalizeKazakhstanPhone(value: string): string | null {
  let digits = value.replace(/\D/g, '');
  const hasExplicitCountryCode = /^\s*\+7/.test(value);

  if (digits.length === 10 && !hasExplicitCountryCode) digits = `7${digits}`;
  if (digits.length === 11 && digits.startsWith('8')) digits = `7${digits.slice(1)}`;

  return digits.length === 11 && digits.startsWith('7') ? `+${digits}` : null;
}

export function formatKazakhstanPhoneInput(value: string): string {
  let digits = value.replace(/\D/g, '');
  const hasExplicitCountryCode = /^\s*\+7/.test(value);

  if (digits.length === 11 && digits.startsWith('8')) digits = `7${digits.slice(1)}`;
  else if (digits.length === 11 && digits.startsWith('7')) digits = digits.slice(0, 11);
  else if (hasExplicitCountryCode && digits.startsWith('7')) digits = digits.slice(0, 11);
  else if (digits.length <= 10) digits = `7${digits}`;
  else digits = '7';
  digits = digits.slice(0, 11);

  const local = digits.slice(1);
  let formatted = '+7';
  if (local.length > 0) formatted += ` ${local.slice(0, 3)}`;
  if (local.length > 3) formatted += ` ${local.slice(3, 6)}`;
  if (local.length > 6) formatted += ` ${local.slice(6, 8)}`;
  if (local.length > 8) formatted += ` ${local.slice(8, 10)}`;
  return formatted;
}
