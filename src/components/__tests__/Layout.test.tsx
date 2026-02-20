import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import Layout from '../Layout';

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => true,
}));

vi.mock('@/hooks/use-responsive', () => ({
  useResponsive: () => ({ isMobile: true }),
}));

vi.mock('../header/Header', () => ({
  default: () => null,
}));

describe('Layout', () => {
  it('adds bottom nav spacing when mobile navigation is visible', () => {
    const { container } = render(
      <MemoryRouter>
        <Layout showHeader={false}>
          <div>content</div>
        </Layout>
      </MemoryRouter>
    );

    expect(container.querySelector('main > div')).toHaveClass('pb-[calc(4rem+var(--safe-area-bottom))]');
  });

  it('keeps only safe-area bottom padding when navigation is hidden', () => {
    const { container } = render(
      <MemoryRouter>
        <Layout showHeader={false} hideNavigation>
          <div>content</div>
        </Layout>
      </MemoryRouter>
    );

    expect(container.querySelector('main > div')).toHaveClass('pb-safe-bottom');
  });
});
