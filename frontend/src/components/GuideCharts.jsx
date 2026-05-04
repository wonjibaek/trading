import React, { useState, useEffect } from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ReferenceLine
} from 'recharts';
import { Table as TableIcon, Activity, RefreshCw } from 'lucide-react';

// ==========================================
// 💹 Indicator Calculation Helpers
// ==========================================

const calculateIndicators = (data) => {
  if (data.length < 20) return data;

  const result = [...data];

  // 1. EMA (Exponential Moving Average) - 20 period
  const k = 2 / (20 + 1);
  let ema = result[0].close;
  for (let i = 0; i < result.length; i++) {
    ema = result[i].close * k + ema * (1 - k);
    result[i].ema20 = ema;
  }

  // 2. Bollinger Bands (20, 2)
  for (let i = 19; i < result.length; i++) {
    const slice = result.slice(i - 19, i + 1);
    const mean = slice.reduce((acc, curr) => acc + curr.close, 0) / 20;
    const stdDev = Math.sqrt(slice.reduce((acc, curr) => acc + Math.pow(curr.close - mean, 2), 0) / 20);
    result[i].bbUpper = mean + (stdDev * 2);
    result[i].bbLower = mean - (stdDev * 2);
  }

  // 3. RSI (Relative Strength Index) - 14 period
  let gains = 0, losses = 0;
  for (let i = 1; i < 15; i++) {
    const diff = result[i].close - result[i-1].close;
    if (diff > 0) gains += diff; else losses -= diff;
  }
  let avgGain = gains / 14;
  let avgLoss = losses / 14;

  for (let i = 15; i < result.length; i++) {
    const diff = result[i].close - result[i-1].close;
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * 13 + gain) / 14;
    avgLoss = (avgLoss * 13 + loss) / 14;
    const rs = avgGain / (avgLoss || 1);
    result[i].rsi = 100 - (100 / (1 + rs));
  }

  // 4. VWAP (Volume Weighted Average Price)
  let cumulativePV = 0;
  let cumulativeV = 0;
  for (let i = 0; i < result.length; i++) {
    cumulativePV += result[i].close * result[i].volume;
    cumulativeV += result[i].volume;
    result[i].vwap = cumulativePV / (cumulativeV || 1);
  }

  return result;
};

// ==========================================
// 🎨 Chart Components
// ==========================================

const Candlestick = (props) => {
  const { x, y, width, height, payload } = props;
  const { open, close, high, low } = payload;
  const isUp = close >= open;
  const color = isUp ? '#10B981' : '#EF4444';

  const bodyTop = Math.min(y, y + height);
  const bodyHeight = Math.max(Math.abs(height), 2);
  const pixelRange = height / Math.max(Math.abs(open - close), 0.0001);
  const highY = y - (high - Math.max(open, close)) * pixelRange;
  const lowY = (y + height) + (Math.min(open, close) - low) * pixelRange;

  return (
    <g>
      <line x1={x + width / 2} y1={highY} x2={x + width / 2} y2={lowY} stroke={color} strokeWidth={1.2} />
      <rect x={x} y={y} width={width} height={bodyHeight} fill={color} />
    </g>
  );
};

const GuideCharts = ({ apiUrl }) => {
  const [candles, setCandles] = useState([]);
  const [orderBook, setOrderBook] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const candleRes = await fetch(`${apiUrl}/market/candles?count=100`);
      const candleData = await candleRes.json();
      
      let formatted = candleData.map((c, i) => ({
        x: i,
        open: c.opening_price,
        high: c.high_price,
        low: c.low_price,
        close: c.trade_price,
        range: [c.opening_price, c.trade_price],
        volume: c.candle_acc_trade_volume,
        timestamp: new Date(c.candle_date_time_kst).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      })).reverse();
      
      // 지표 계산 적용
      formatted = calculateIndicators(formatted);
      // 마지막 40개만 보여줌 (지표 계산 정확도를 위해 100개 가져옴)
      setCandles(formatted.slice(-40));

      const obRes = await fetch(`${apiUrl}/market/orderbook`);
      const obData = await obRes.json();
      setOrderBook(obData);
    } catch (error) {
      console.error("Failed to fetch market data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [apiUrl]);

  return (
    <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: '2.5fr 1fr', marginBottom: '40px' }}>
      
      {/* 윈도우 1: 실시간 통합 분석 차트 */}
      <div className="glass-panel" style={{ padding: '24px', minHeight: '600px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 className="heading-gradient" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
            <Activity size={20} className="text-profit" />
            BTC/KRW 실시간 분석 (EMA, BB, VWAP, RSI)
          </h3>
          <button onClick={fetchData} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Main Chart: Candles + EMA + BB + VWAP + Volume */}
        <div style={{ width: '100%', height: '350px' }}>
          <ResponsiveContainer>
            <ComposedChart data={candles} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis dataKey="timestamp" hide />
              <YAxis domain={['auto', 'auto']} orientation="right" tick={{fill: 'var(--text-muted)', fontSize: 10}} tickLine={false} />
              <Tooltip 
                contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                itemStyle={{ fontSize: '0.75rem' }}
              />
              
              {/* Bollinger Bands Area */}
              <Area type="monotone" dataKey="bbUpper" stroke="none" fill="rgba(59, 130, 246, 0.05)" />
              <Area type="monotone" dataKey="bbLower" stroke="none" fill="rgba(59, 130, 246, 0.05)" />
              
              {/* Volume (Background) */}
              <Bar dataKey="volume" fill="rgba(255, 255, 255, 0.05)" barSize={20} />
              
              {/* Candlesticks */}
              <Bar dataKey="range" shape={<Candlestick />} name="Price" />
              
              {/* Lines */}
              <Line type="monotone" dataKey="ema20" stroke="var(--accent-neon)" dot={false} strokeWidth={2} name="EMA 20" />
              <Line type="monotone" dataKey="vwap" stroke="#F59E0B" dot={false} strokeWidth={1.5} name="VWAP" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Sub Chart: RSI */}
        <div style={{ width: '100%', height: '120px', marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '5px' }}>RSI (14)</div>
          <ResponsiveContainer>
            <ComposedChart data={candles}>
              <XAxis dataKey="timestamp" tick={{fill: 'var(--text-muted)', fontSize: 9}} tickLine={false} />
              <YAxis domain={[0, 100]} orientation="right" tick={{fill: 'var(--text-muted)', fontSize: 9}} ticks={[30, 70]} tickLine={false} />
              <Tooltip contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
              <ReferenceLine y={70} stroke="rgba(239, 68, 68, 0.3)" strokeDasharray="3 3" />
              <ReferenceLine y={30} stroke="rgba(16, 185, 129, 0.3)" strokeDasharray="3 3" />
              <Line type="monotone" dataKey="rsi" stroke="#F59E0B" dot={false} strokeWidth={1.5} name="RSI" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 윈도우 2: 실시간 호가 */}
      <div className="glass-panel" style={{ padding: '20px', overflow: 'hidden' }}>
        <h3 className="heading-gradient" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', marginBottom: '16px' }}>
          <TableIcon size={18} className="text-muted" />
          실시간 호가창
        </h3>
        
        {orderBook ? (
          <div style={{ fontSize: '0.8rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', padding: '8px 0', color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span>가격 (KRW)</span>
              <span style={{ textAlign: 'right' }}>잔량</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column-reverse' }}>
              {orderBook.orderbook_units.slice(0, 10).reverse().map((unit, i) => (
                <div key={`ask-${i}`} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', padding: '5px 0', color: '#EF4444', background: 'rgba(239, 68, 68, 0.03)' }}>
                  <span style={{fontWeight: 'bold'}}>{unit.ask_price.toLocaleString()}</span>
                  <span style={{ textAlign: 'right', color: 'var(--text-main)' }}>{unit.ask_size.toFixed(3)}</span>
                </div>
              ))}
              <div style={{ padding: '8px', textAlign: 'center', background: 'rgba(255,255,255,0.05)', color: '#fff', fontWeight: 'bold', margin: '2px 0', fontSize: '0.9rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                {orderBook.orderbook_units[0].ask_price.toLocaleString()}
              </div>
              {orderBook.orderbook_units.slice(0, 10).map((unit, i) => (
                <div key={`bid-${i}`} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', padding: '5px 0', color: '#10B981', background: 'rgba(16, 185, 129, 0.03)' }}>
                  <span style={{fontWeight: 'bold'}}>{unit.bid_price.toLocaleString()}</span>
                  <span style={{ textAlign: 'right', color: 'var(--text-main)' }}>{unit.bid_size.toFixed(3)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: '100px' }}>...</div>
        )}
      </div>

    </div>
  );
};

export default GuideCharts;
