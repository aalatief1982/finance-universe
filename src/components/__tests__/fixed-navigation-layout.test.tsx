import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
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
    expect(wrapper.className).toContain('transform-gpu');
    expect(wrapper.className).toContain('will-change-transform');
  });

  it('keeps bottom navigation fixed with safe area bottom padding', () => {
    render(
      <MemoryRouter initialEntries={['/home']}>
        <BottomNav />
      </MemoryRouter>
    );

    const homeLink = screen.getByRole('link', { name: 'Home' });
    const nav = homeLink.closest('nav');
    const list = nav?.querySelector('ul');

    expect(nav).toHaveClass('fixed', 'bottom-0');
    expect(nav).toHaveClass('transform-gpu', 'will-change-transform');
    expect(list?.className).toContain('pb-[calc(0.5rem+var(--safe-area-bottom))]');
  });
});
