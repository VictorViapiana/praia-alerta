/**
 * O Chrome instala a PWA gerando um WebAPK. O molde público desse pacote
 * ainda declara targetSdk 33. O Play Protect bloqueia a instalação quando
 * o targetSdk fica mais de duas APIs atrás do celular — no Android 16
 * (API 36) o aviso é "app de risco / versão antiga".
 * O Samsung Internet gera um pacote ainda mais velho.
 * Nesses casos o manifesto deixa de ser instalável e o celular cria um atalho.
 */

export function androidMajor(version: string | null | undefined): number | null {
  if (!version) return null;
  const cleaned = version.trim().replace(/^"|"$/g, "");
  const match = cleaned.match(/^(\d+)/);
  if (!match) return null;
  const major = Number(match[1]);
  return Number.isFinite(major) ? major : null;
}

export function webApkWouldBeBlocked(userAgent: string, platformVersion?: string | null): boolean {
  const ua = userAgent || "";
  if (!/Android/i.test(ua)) return false;
  if (/SamsungBrowser/i.test(ua)) return true;

  const hinted = androidMajor(platformVersion);
  if (hinted != null) return hinted >= 16;

  const fromUa = androidMajor(ua.match(/Android\s+(\d+)/i)?.[1]);
  if (fromUa == null) return true;
  // O Chrome congela o Android do User-Agent em 10. Sem a versão real, não gera WebAPK.
  if (fromUa === 10 && /Chrome\/\d/i.test(ua) && !/EdgA\/|OPR\/|SamsungBrowser/i.test(ua)) return true;
  return fromUa >= 16;
}

export function isInAppBrowser(userAgent: string): boolean {
  return /WhatsApp|Instagram|FBAN|FBAV|FB_IAB|Line\/|Twitter|TikTok|Musical_ly|Snapchat|MicroMessenger/i.test(
    userAgent,
  );
}
