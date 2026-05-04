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
  Area
} from 'recharts';
import { Table as TableIcon, Activity, RefreshCw } from 'lucide-react';

// Custom Candlestick Component
const Candlestick = (props) => {
  const { x, y, width, height, low, high, open, close } = props;
  const isUp = close >= open;
  const color = isUp ? '#10B981' : '#EF4444';
  const ratio = height / Math.max(Math.abs(open - close), 0.0001);

  return (
    <g>
      <line
        x1={x + width / 2}
        y1={y - (high - Math.max(open, close)) * ratio}
        x2={x + width / 2}
        y2={y + height + (Math.min(open, close) - low) * ratio}
        stroke={color}
        strokeWidth={1.5}
      />
      <rect
        x={x}
        y={y}
        width={width}
        height={Math.max(height, 2)}
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
      // 1. Upbit Candles Fetch (via our Backend)
      const candleRes = await fetch(`${apiUrl}/market/candles?count=30`);
      const candleData = await candleRes.json();
      // Upbit returns data in reverse chronological order, need to reverse it for the chart
      const formattedCandles = candleData.map((c, i) => ({
        x: i,
        open: c.opening_price,
        high: c.high_price,
        low: c.low_price,
        close: c.trade_price,
        volume: c.candle_acc_trade_volume,
        timestamp: c.candle_date_time_kst
      })).reverse();
      setCandles(formattedCandles);

      // 2. Upbit Orderbook Fetch (via our Backend)
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
    // 30초마다 자동 갱신
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [apiUrl]);

  return (
    <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: '2fr 1fr', marginBottom: '40px', minHeight: '500px' }}>
      
      {/* 윈도우 1: 실시간 업비트 차트 */}
      <div className="glass-panel" style={{ padding: '24px', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 className="heading-gradient" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
            <Activity size={20} className="text-profit" />
            BTC/KRW 실시간 차트 (Upbit API)
          </h3>
          <button onClick={fetchData} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div style={{ width: '100%', height: '400px' }}>
          {candles.length > 0 ? (
            <ResponsiveContainer>
              <ComposedChart data={candles}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="x" hide />
                <YAxis domain={['auto', 'auto']} hide />
                <Tooltip 
                  contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  labelStyle={{ display: 'none' }}
                />
                
                {/* Candlesticks */}
                <Bar dataKey="close" shape={<Candlestick />} name="Price" />
                
                {/* Volume (Background) */}
                <Bar dataKey="volume" fill="rgba(59, 130, 246, 0.1)" barSize={20} name="Volume" />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
              데이터를 불러오는 중...
            </div>
          )}
        </div>
        
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span>Market: KRW-BTC (Upbit)</span>
          <span>Last Updated: {candles.length > 0 ? candles[candles.length-1].timestamp : '-'}</span>
        </div>
      </div>

      {/* 윈도우 2: 실시간 호가 데이터 */}
      <div className="glass-panel" style={{ padding: '24px', overflow: 'hidden' }}>
        <h3 className="heading-gradient" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', marginBottom: '20px' }}>
          <TableIcon size={20} className="text-muted" />
          실시간 호가 (Order Book)
        </h3>
        
        {orderBook ? (
          <div style={{ fontSize: '0.85rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-muted)', fontWeight: 'bold' }}>
              <span>Price (KRW)</span>
              <span style={{ textAlign: 'right' }}>Size</span>
              <span style={{ textAlign: 'right' }}>Sum</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column-reverse' }}>
              {/* Ask levels */}
              {orderBook.orderbook_units.slice(0, 5).reverse().map((unit, i) => (
                <div key={`ask-${i}`} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', padding: '8px 0', color: '#EF4444', background: 'rgba(239, 68, 68, 0.03)' }}>
                  <span>{unit.ask_price.toLocaleString()}</span>
                  <span style={{ textAlign: 'right', color: 'var(--text-main)' }}>{unit.ask_size.toFixed(4)}</span>
                  <span style={{ textAlign: 'right', color: 'var(--text-muted)' }}>-</span>
                </div>
              ))}
              
              {/* Mid Price Separator */}
              <div style={{ padding: '10px', textAlign: 'center', background: 'rgba(59, 130, 246, 0.1)', color: '#fff', fontWeight: 'bold', margin: '4px 0' }}>
                {orderBook.orderbook_units[0].ask_price.toLocaleString()}
              </div>

              {/* Bid levels */}
              {orderBook.orderbook_units.slice(0, 5).map((unit, i) => (
                <div key={`bid-${i}`} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', padding: '8px 0', color: '#10B981', background: 'rgba(16, 185, 129, 0.03)' }}>
                  <span>{unit.bid_price.toLocaleString()}</span>
                  <span style={{ textAlign: 'right', color: 'var(--text-main)' }}>{unit.bid_size.toFixed(4)}</span>
                  <span style={{ textAlign: 'right', color: 'var(--text-muted)' }}>-</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: '100px' }}>호가창 로딩 중...</div>
        )}
      </div>

    </div>
  );
};

export default GuideCharts;
