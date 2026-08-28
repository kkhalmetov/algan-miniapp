export type PaymentResult = 'paid' | 'failed';

const MOCK_FAILURE_PARAM = 'mockPayment';

export async function processPayment(): Promise<PaymentResult> {
  if (typeof window === 'undefined') return 'paid';

  const url = new URL(window.location.href);
  if (url.searchParams.get(MOCK_FAILURE_PARAM) !== 'failed') return 'paid';

  url.searchParams.delete(MOCK_FAILURE_PARAM);
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  return 'failed';
}
