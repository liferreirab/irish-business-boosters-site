export const META_PIXEL_ID = "960290909873889";

type Fbq = (...args: unknown[]) => void;

export function trackPixel(event: string, params?: Record<string, unknown>) {
  const fbq = (window as unknown as { fbq?: Fbq }).fbq;
  if (fbq) fbq("track", event, params);
}
