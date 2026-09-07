import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppErrorFallback } from '../components/app-error';

describe('application error fallback', () => {
  it('offers retry and a direct support contact', () => {
    const retry = vi.fn();
    render(<AppErrorFallback onRetry={retry} />);

    expect(screen.getByRole('heading', { name: 'Қосымшаны жүктеу мүмкін болмады' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Қолдау.*algansupport@gmail.com/ })).toHaveAttribute('href', 'mailto:algansupport@gmail.com');
    fireEvent.click(screen.getByRole('button', { name: /Попробовать снова/ }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
