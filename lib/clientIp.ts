/**
 * Header to pass on when an API route calls the Express backend on behalf of a kiosk.
 *
 * The backend rate-limits per client address (100 requests a minute). These server-side calls
 * all come from this one container, so without the header every kiosk in the bank shared a
 * single budget. The backend only trusts X-Forwarded-For from the Docker network (TRUST_PROXY).
 *
 * Next.js fills in x-forwarded-for with the connection's address when the browser did not
 * send one.
 */
export function forwardClientIp(request: Request): Record<string, string> {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip')?.trim() || '';
  return ip ? { 'X-Forwarded-For': ip } : {};
}
