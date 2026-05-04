import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Table as TableIcon, Activity, RefreshCw } from 'lucide-react';

// 전문적인 캔들스틱 모양을 그리는 컴포넌트
const Candlestick = (props) => {
  const { x, y, width, height, payload } = props;
  const { open, close, high, low } = payload;
  const isUp = close >= open;
  const color = isUp ? '#10B981' : '#EF4444';

  // Y축 스케일에 맞춘 좌표 계산
  // Recharts에서 Bar의 y와 height는 해당 데이터값의 상단과 높이를 나타냄
  // 여기서는 별도의 계산 없이 payload의 값을 활용해 직접 그립니다.
  
  // 가격 -> 픽셀 변환을 위한 비율 계산 (props에서 제공하는 좌표 활용)
  const bodyTop = Math.min(y, y + height);
  const bodyBottom = Math.max(y, y + height);
  const bodyHeight = Math.max(Math.abs(height), 2);

  // 꼬리(Wick) 좌표 계산을 위한 보간
  const candleRange = Math.max(high - low, 0.0001);
  const pixelRange = height / Math.max(Math.abs(open - close), 0.0001);
  
  const highY = y - (high - Math.max(open, close)) * pixelRange;
  const lowY = (y + height) + (Math.min(open, close) - low) * pixelRange;

  return (
    <g>
      {/* 꼬리 (Wick) */}
      <line
        x1={x + width / 2}
        y1={highY}
        x2={x + width / 2}
        y2={lowY}
        stroke={color}
        strokeWidth={1.5}
      />
      {/* 몸통 (Body) */}
      <rect
        x={x}
        y={y}
        width={width}
        height={bodyHeight}
        fill={color}
      />
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
      const candleRes = await fetch(`${apiUrl}/market/candles?count=40`);
      const candleData = await candleRes.json();
      
      const formattedCandles = candleData.map((c, i) => ({
        x: i,
        open: c.opening_price,
        high: c.high_price,
        low: c.low_price,
        close: c.trade_price,
        // Recharts Bar가 [시가, 종가] 범위를 그리도록 설정
        range: [c.opening_price, c.trade_price],
        volume: c.candle_acc_trade_volume,
        timestamp: new Date(c.candle_date_time_kst).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      })).reverse();
      
      setCandles(formattedCandles);

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
    const interval = setInterval(fetchData, 10000); // 10초마다 갱신
    return () => clearInterval(interval);
  }, [apiUrl]);

  return (
    <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: '2.5fr 1fr', marginBottom: '40px' }}>
      
      {/* 윈도우 1: 실시간 차트 */}
      <div className="glass-panel" style={{ padding: '24px', minHeight: '480px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 className="heading-gradient" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
            <Activity size={20} className="text-profit" />
            BTC/KRW 실시간 1시간봉 (Upbit)
          </h3>
          <button onClick={fetchData} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div style={{ width: '100%', height: '380px' }}>
          {candles.length > 0 ? (
            <ResponsiveContainer>
              <BarChart data={candles} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="timestamp" tick={{fill: 'var(--text-muted)', fontSize: 10}} tickLine={false} />
                <YAxis domain={['auto', 'auto']} orientation="right" tick={{fill: 'var(--text-muted)', fontSize: 10}} tickLine={false} />
                <Tooltip 
                  contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ fontSize: '0.8rem' }}
                  labelStyle={{ color: 'var(--text-muted)', marginBottom: '4px' }}
                />
                <Bar dataKey="range" shape={<Candlestick />} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>로딩 중...</div>
          )}
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
              {orderBook.orderbook_units.slice(0, 8).reverse().map((unit, i) => (
                <div key={`ask-${i}`} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', padding: '6px 0', color: '#EF4444', background: 'rgba(239, 68, 68, 0.03)' }}>
                  <span style={{fontWeight: 'bold'}}>{unit.ask_price.toLocaleString()}</span>
                  <span style={{ textAlign: 'right', color: 'var(--text-main)' }}>{unit.ask_size.toFixed(3)}</span>
                </div>
              ))}
              
              <div style={{ padding: '8px', textAlign: 'center', background: 'rgba(255,255,255,0.05)', color: '#fff', fontWeight: 'bold', margin: '2px 0', fontSize: '0.9rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                {orderBook.orderbook_units[0].ask_price.toLocaleString()}
              </div>

              {orderBook.orderbook_units.slice(0, 8).map((unit, i) => (
                <div key={`bid-${i}`} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', padding: '6px 0', color: '#10B981', background: 'rgba(16, 185, 129, 0.03)' }}>
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
