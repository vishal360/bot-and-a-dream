export const fmtUSD = (v: number, dp = 2) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  }).format(v);

export const fmtSignedUSD = (v: number, dp = 2) =>
  (v >= 0 ? "+" : "−") +
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  })
    .format(Math.abs(v))
    .replace("$", "$");

export const fmtPct = (v: number, dp = 2) =>
  `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(dp)}%`;

export const fmtNum = (v: number, dp = 2) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  }).format(v);

export const fmtInt = (v: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(v);

export const fmtTime = (ts: number) =>
  new Date(ts).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

export const fmtClock = () =>
  new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

export const fmtUptime = (sec: number) => {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

export const pnlClass = (v: number) => (v >= 0 ? "text-up" : "text-down");
