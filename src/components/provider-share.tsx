import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ag";

export const providerUrl = (slug: string) =>
  typeof window === "undefined" ? `/p/${slug}` : `${window.location.origin}/p/${slug}`;

/** Copy link, open page and QR code for a provider storefront. */
export function ProviderShare({ slug, name }: { slug: string; name: string }) {
  const [qr, setQr] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const url = providerUrl(slug);

  useEffect(() => {
    if (!showQr) return;
    QRCode.toDataURL(url, { width: 480, margin: 1 }).then(setQr).catch(() => setQr(null));
  }, [showQr, url]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied.");
    } catch {
      toast.error("Couldn't copy — select the link and copy it manually.");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <code className="max-w-full truncate rounded-lg border border-border bg-paper px-3 py-2 text-xs">{url}</code>
        <Button size="sm" onClick={copy}>
          Copy link
        </Button>
        <a
          href={`/p/${slug}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 items-center rounded-lg border border-border-strong px-3.5 text-[0.8rem] font-semibold hover:bg-secondary"
        >
          Open page
        </a>
        <Button size="sm" variant="soft" onClick={() => setShowQr((v) => !v)}>
          {showQr ? "Hide QR code" : "QR code"}
        </Button>
      </div>
      {showQr && qr ? (
        <div className="flex items-end gap-4">
          <img src={qr} alt={`QR code for ${name}`} className="h-40 w-40 rounded-lg border border-border bg-card p-2" />
          <a href={qr} download={`${slug}-qr.png`} className="text-xs font-semibold text-primary underline">
            Download QR code
          </a>
        </div>
      ) : null}
    </div>
  );
}
