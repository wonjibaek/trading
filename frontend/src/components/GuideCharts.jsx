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
  ReferenceLine,
  Brush
} from 'recharts';
import { Table as TableIcon, Activity, RefreshCw } from 'lucide-react';

// ==========================================
// 💹 Indicator Calculation Helpers
// ==========================================

const calculateIndicators = (data) => {
  if (data.length < 20) return data;
  const result = [...data];

  // EMA 20
  const k = 2 / (20 + 1);
  let ema = result[0].close;
  for (let i = 0; i < result.length; i++) {
    ema = result[i].close * k + ema * (1 - k);
    result[i].ema20 = ema;
  }

  // Bollinger Bands (20, 2)
  for (let i = 19; i < result.length; i++) {
    const slice = result.slice(i - 19, i + 1);
    const mean = slice.reduce((acc, curr) => acc + curr.close, 0) / 20;
    const stdDev = Math.sqrt(slice.reduce((acc, curr) => acc + Math.pow(curr.close - mean, 2), 0) / 20);
    result[i].bbUpper = mean + (stdDev * 2);
    result[i].bbLower = mean - (stdDev * 2);
  }

  // RSI 14
  let gains = 0, losses = 0;
  for (let i = 1; i < 15; i++) {
    const diff = result[i].close - result[i-1].close;
    if (diff > 0) gains += diff; else losses -= diff;
  }
  let avgGain = gains / 14, avgLoss = losses / 14;
  for (let i = 15; i < result.length; i++) {
    const diff = result[i].close - result[i-1].close;
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * 13 + gain) / 14;
    avgLoss = (avgLoss * 13 + loss) / 14;
    const rs = avgGain / (avgLoss || 1);
    result[i].rsi = 100 - (100 / (1 + rs));
  }

  // VWAP
  let cumulativePV = 0, cumulativeV = 0;
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

  const bodyHeight = Math.max(Math.abs(height), 2);
  
  // 가격 범위를 60M ~ 160M으로 고정했을 때의 픽셀 비율 계산
  // Recharts는 내부적으로 스케일링을 하므로 props로 넘어온 y, height를 최대한 활용합니다.
  const pixelRange = height / Math.max(Math.abs(open - close), 0.0001);
  const highY = y - (high - Math.max(open, close)) * pixelRange;
  const lowY = (y + height) + (Math.min(open, close) - low) * pixelRange;

  return (
    <g>
      <line x1={x + width / 2} y1={highY} x2={x + width / 2} y2={lowY} stroke={color} strokeWidth={1.5} />
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
        index: i,
        open: c.opening_price,
        high: c.high_price,
        low: c.low_price,
        close: c.trade_price,
        range: [c.opening_price, c.trade_price],
        volume: c.candle_acc_trade_volume,
        timestamp: new Date(c.candle_date_time_kst).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      })).reverse();
      
      formatted = calculateIndicators(formatted);
      setCandles(formatted);

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
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [apiUrl]);

  return (
    <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: '2.5fr 1fr', marginBottom: '40px' }}>
      
      <div className="glass-panel" style={{ padding: '24px', minHeight: '650px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 className="heading-gradient" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
            <Activity size={20} className="text-profit" />
            업비트 스타일 실시간 통합 차트
          </h3>
          <button onClick={fetchData} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* 윈도우 1: 메인 차트 (60M ~ 160M 고정 스케일) */}
        <div style={{ width: '100%', height: '400px' }}>
          <ResponsiveContainer>
            <ComposedChart data={candles} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis dataKey="timestamp" hide />
              <YAxis 
                domain={[60000000, 160000000]} 
                ticks={[60000000, 80000000, 100000000, 120000000, 140000000, 160000000]}
                orientation="right" 
                tick={{fill: 'var(--text-muted)', fontSize: 10}} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => (val / 10000).toLocaleString() + '만'}
              />
              <Tooltip 
                contentStyle={{ 
                  background: 'rgba(255, 255, 255, 0.9)', 
                  border: 'none', 
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  color: '#000'
                }}
                itemStyle={{ color: '#000', fontWeight: '600', fontSize: '0.8rem' }}
                labelStyle={{ color: '#666', marginBottom: '4px' }}
              />
              
              <Area type="monotone" dataKey="bbUpper" stroke="none" fill="rgba(59, 130, 246, 0.04)" />
              <Area type="monotone" dataKey="bbLower" stroke="none" fill="rgba(59, 130, 246, 0.04)" />
              <Bar dataKey="volume" fill="rgba(255, 255, 255, 0.03)" barSize={20} />
              
              {/* 축 인식 범위를 위한 더미 라인 (Brush 작동 및 축 고정 보조) */}
              <Line dataKey="high" stroke="none" dot={false} />
              <Line dataKey="low" stroke="none" dot={false} />

              <Bar dataKey="range" shape={<Candlestick />} name="시가/종가" />
              <Line type="monotone" dataKey="ema20" stroke="#00D2FF" dot={false} strokeWidth={2} name="EMA 20" />
              <Line type="monotone" dataKey="vwap" stroke="#F59E0B" dot={false} strokeWidth={1.5} name="VWAP" />
              
              {/* 확대/축소 브러쉬 추가 */}
              <Brush 
                dataKey="timestamp" 
                height={30} 
                stroke="rgba(255,255,255,0.1)" 
                fill="rgba(0,0,0,0.2)"
                startIndex={candles.length - 30}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* 윈도우 2: RSI 차트 */}
        <div style={{ width: '100%', height: '120px', marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '5px' }}>RSI (14)</div>
          <ResponsiveContainer>
            <ComposedChart data={candles}>
              <XAxis dataKey="timestamp" tick={{fill: 'var(--text-muted)', fontSize: 9}} tickLine={false} />
              <YAxis domain={[0, 100]} orientation="right" tick={{fill: 'var(--text-muted)', fontSize: 9}} ticks={[30, 70]} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ background: 'rgba(255, 255, 255, 0.9)', border: 'none', borderRadius: '8px', color: '#000' }}
                itemStyle={{ color: '#000' }}
              />
              <ReferenceLine y={70} stroke="rgba(239, 68, 68, 0.3)" strokeDasharray="3 3" />
              <ReferenceLine y={30} stroke="rgba(16, 185, 129, 0.3)" strokeDasharray="3 3" />
              <Line type="monotone" dataKey="rsi" stroke="#F59E0B" dot={false} strokeWidth={1.5} name="RSI" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 윈도우 3: 실시간 호가 */}
      <div className="glass-panel" style={{ padding: '20px', overflow: 'hidden' }}>
        <h3 className="heading-gradient" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', marginBottom: '16px' }}>
          <TableIcon size={18} className="text-muted" />
          실시간 호가 데이터
        </h3>
        
        {orderBook ? (
          <div style={{ fontSize: '0.75rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column-reverse' }}>
              {orderBook.orderbook_units.slice(0, 12).reverse().map((unit, i) => (
                <div key={`ask-${i}`} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', padding: '4px 0', color: '#EF4444', background: 'rgba(239, 68, 68, 0.03)' }}>
                  <span style={{fontWeight: 'bold'}}>{unit.ask_price.toLocaleString()}</span>
                  <span style={{ textAlign: 'right', color: 'var(--text-main)' }}>{unit.ask_size.toFixed(3)}</span>
                </div>
              ))}
              <div style={{ padding: '6px', textAlign: 'center', background: 'rgba(255,255,255,0.05)', color: '#fff', fontWeight: 'bold', margin: '2px 0', fontSize: '0.85rem' }}>
                {orderBook.orderbook_units[0].ask_price.toLocaleString()}
              </div>
              {orderBook.orderbook_units.slice(0, 12).map((unit, i) => (
                <div key={`bid-${i}`} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', padding: '4px 0', color: '#10B981', background: 'rgba(16, 185, 129, 0.03)' }}>
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
