export const calculateRR = (entry: number, sl: number, tp: number): number => {
  const risk = Math.abs(entry - sl);
  const reward = Math.abs(tp - entry);
  return risk === 0 ? 0 : Number((reward / risk).toFixed(2));
};
