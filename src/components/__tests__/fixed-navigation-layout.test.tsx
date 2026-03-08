import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '@/i18n/LanguageContext';
import PageHeader from '@/components/layout/PageHeader';
import BottomNav from '@/components/BottomNav';

describe('Fixed navigation layout', () => {
  it('keeps page header sticky below the safe-area-aware app header', () => {
    const { container } = render(
      <MemoryRouter>
        <PageHeader title="Dashboard" />
      </MemoryRouter>
    );

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain('sticky');
    expect(wrapper.className).toContain('top-[calc(var(--header-height)+var(--safe-area-top))]');
  });

  it('keeps bottom navigation fixed with safe area bottom padding', () => {
    render(
      <LanguageProvider>
        <MemoryRouter initialEntries={['/home']}>
          <BottomNav />
        </MemoryRouter>
      </LanguageProvider>
    );

    const homeLink = screen.getByRole('link', { name: 'Home' });
    const nav = homeLink.closest('nav');
    const list = nav?.querySelector('ul');

    expect(nav).toHaveClass('fixed', 'bottom-0');
    expect(list?.className).toContain('pb-[calc(0.5rem+var(--safe-area-bottom))]');
  });
});
