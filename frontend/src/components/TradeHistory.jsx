import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, TrendingDown, MessageSquare, ChevronRight, Filter } from 'lucide-react';

const TradeHistory = ({ apiUrl }) => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrade, setSelectedTrade] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(`${apiUrl}/trades`);
        const data = await response.json();
        // API 결과에서 trades 배열 추출
        setTrades(data.trades || []);
      } catch (error) {
        console.error("Failed to fetch history:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [apiUrl]);

  if (loading) return <div className="text-center py-20 text-muted">기록을 불러오는 중...</div>;

  return (
    <div className="animate-slide-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 className="heading-gradient" style={{ fontSize: '1.5rem' }}>나의 트레이딩 히스토리</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <span className="glass-panel" style={{ padding: '6px 12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            총 {trades.length}건의 기록
          </span>
        </div>
      </div>

      {trades.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          아직 기록된 매매가 없습니다. 첫 훈련을 시작해보세요!
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {trades.map((trade) => (
            <div 
              key={trade.id} 
              className="glass-panel hover-card" 
              style={{ 
                padding: '20px', 
                cursor: 'pointer',
                borderLeft: `4px solid ${trade.outcome === 'Win' ? 'var(--profit-green)' : trade.outcome === 'Loss' ? 'var(--loss-red)' : 'var(--text-muted)'}`
              }}
              onClick={() => setSelectedTrade(trade)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      padding: '2px 8px', 
                      borderRadius: '4px', 
                      background: trade.side === 'Long' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: trade.side === 'Long' ? 'var(--profit-green)' : 'var(--loss-red)'
                    }}>
                      {trade.side}
                    </span>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>{trade.title}</h3>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={14} /> {new Date(trade.created_at).toLocaleDateString()}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <TrendingUp size={14} /> R:R {trade.rr || 'N/A'}
                    </span>
                    <span style={{ 
                      color: trade.score < 40 ? 'var(--profit-green)' : 'var(--loss-red)',
                      fontWeight: 'bold'
                    }}>
                      심리 점수: {trade.score}점
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: trade.pnl_percent > 0 ? 'var(--profit-green)' : trade.pnl_percent < 0 ? 'var(--loss-red)' : '#fff' }}>
                    {trade.pnl_percent > 0 ? '+' : ''}{trade.pnl_percent}%
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{trade.outcome}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 상세 보기 모달 (심플 버전) */}
      {selectedTrade && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 1000, padding: '20px'
        }} onClick={() => setSelectedTrade(null)}>
          <div className="glass-panel" style={{ 
            maxWidth: '600px', width: '100%', maxHeight: '80vh', overflowY: 'auto', 
            padding: '32px', position: 'relative' 
          }} onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedTrade(null)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.5rem' }}
            >
              &times;
            </button>
            <h2 className="heading-gradient" style={{ marginBottom: '8px' }}>{selectedTrade.title}</h2>
            <p className="text-muted" style={{ marginBottom: '24px' }}>{selectedTrade.thesis}</p>
            
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ color: 'var(--accent-neon)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={18} /> AI 피드백 다시보기
              </h4>
              <div style={{ 
                background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', 
                fontSize: '0.9rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' 
              }}>
                {selectedTrade.feedback}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="glass-panel" style={{ padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>진입가</div>
                <div style={{ fontWeight: 'bold' }}>{selectedTrade.entry.toLocaleString()}</div>
              </div>
              <div className="glass-panel" style={{ padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>결과</div>
                <div style={{ fontWeight: 'bold' }}>{selectedTrade.outcome}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradeHistory;
