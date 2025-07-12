import { renderHook, act } from '@testing-library/react';
import { useGuidedTips } from '@/hooks/useGuidedTips';

describe('useGuidedTips', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows tip when not previously dismissed', () => {
    const { result } = renderHook(() => useGuidedTips('dashboard'));
    expect(result.current.visible).toBe(true);
  });

  it('persists dismissal', () => {
    const { result } = renderHook(() => useGuidedTips('dashboard'));
    act(() => result.current.dismiss());
    expect(result.current.visible).toBe(false);
    expect(localStorage.getItem('xpensia_tip_dashboard_shown')).toBe('true');

    const { result: next } = renderHook(() => useGuidedTips('dashboard'));
    expect(next.current.visible).toBe(false);
  });
});
