import { calculateRR } from '../src/utils/math';

describe('calculateRR', () => {
  it('returns reward to risk ratio', () => {
    expect(calculateRR(1.1, 1.095, 1.1125)).toBe(2.5);
  });

  it('handles zero risk', () => {
    expect(calculateRR(1.1, 1.1, 1.1125)).toBe(0);
  });
});
