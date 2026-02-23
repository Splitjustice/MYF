import React from 'react';
import { View } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';
import { colors } from '../theme/colors';

interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
}

export const CandleChart = ({ candles, entry, sl, tp }: { candles: Candle[]; entry: number; sl: number; tp: number }) => {
  const width = 340;
  const height = 220;
  const padding = 20;
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);
  const max = Math.max(...highs, entry, sl, tp);
  const min = Math.min(...lows, entry, sl, tp);
  const scaleY = (p: number) => padding + ((max - p) / (max - min || 1)) * (height - padding * 2);
  const candleW = (width - padding * 2) / candles.length;

  return (
    <View>
      <Svg width={width} height={height}>
        {candles.map((c, idx) => {
          const x = padding + idx * candleW + candleW / 2;
          const o = scaleY(c.open);
          const cl = scaleY(c.close);
          const h = scaleY(c.high);
          const l = scaleY(c.low);
          const bullish = c.close >= c.open;
          return (
            <React.Fragment key={idx}>
              <Line x1={x} y1={h} x2={x} y2={l} stroke={colors.muted} strokeWidth={1} />
              <Rect x={x - candleW * 0.25} y={Math.min(o, cl)} width={candleW * 0.5} height={Math.max(Math.abs(cl - o), 2)} fill={bullish ? colors.success : colors.danger} />
            </React.Fragment>
          );
        })}
        {[{ v: entry, c: colors.primary }, { v: sl, c: colors.danger }, { v: tp, c: colors.success }].map((level, idx) => (
          <Line key={idx} x1={padding} x2={width - padding} y1={scaleY(level.v)} y2={scaleY(level.v)} stroke={level.c} strokeDasharray="4,4" />
        ))}
      </Svg>
    </View>
  );
};
