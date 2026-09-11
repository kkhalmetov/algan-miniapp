import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppErrorFallback } from '../components/app-error';
import { useAppStore } from '../lib/store';

describe('application error fallback', () => {
  afterEach(cleanup);

  it('shows Russian copy for the selected Russian language', () => {
    useAppStore.setState({ locale: 'ru' });
    const retry = vi.fn();
    render(<AppErrorFallback onRetry={retry} />);

    expect(screen.getByRole('heading', { name: 'Не удалось загрузить приложение' })).toBeInTheDocument();
    expect(screen.getByText('Проверьте соединение и попробуйте ещё раз.')).toBeInTheDocument();
    expect(screen.queryByText(/Қосымшаны|Қайталап|Қолдау/)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Поддержка.*algansupport@gmail.com/ })).toHaveAttribute('href', 'mailto:algansupport@gmail.com');
    fireEvent.click(screen.getByRole('button', { name: 'Попробовать снова' }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it('shows Kazakh copy for the selected Kazakh language', () => {
    useAppStore.setState({ locale: 'kk' });
    render(<AppErrorFallback onRetry={() => undefined} />);

    expect(screen.getByRole('heading', { name: 'Қосымшаны жүктеу мүмкін болмады' })).toBeInTheDocument();
    expect(screen.getByText('Интернет байланысын тексеріп, қайталап көріңіз.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Қайталап көру' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Қолдау.*algansupport@gmail.com/ })).toHaveAttribute('href', 'mailto:algansupport@gmail.com');
    expect(screen.queryByText(/Не удалось|Попробовать|Поддержка/)).not.toBeInTheDocument();
  });
});
