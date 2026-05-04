import { useState } from 'react';
import { Send, Upload } from 'lucide-react';

const TradeForm = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    title: '',
    side: 'Long',
    entry: '',
    tp: '',
    sl: '',
    thesis: '',
    confidence: 5,
    impatience: 0,
    revenge: 0,
    fomo: 0,
    checklist_checked: 0,
    stop_defined: true,
    outcome: 'Planned Only',
    pnl_percent: 0,
    reflection: '',
    trend_choice: '상승장 (Uptrend)',
    structure_choice: '지지/저항 돌파 (Breakout)',
    candle_choice: '장대양봉/음봉 (Marubozu)',
    volume_choice: '거래량 급증 (Volume Spike)',
    indicator_choice: '이평선 정배열/역배열',
    final_choice: '진입 근거 충족 (Valid Entry)',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      data.append(key, formData[key]);
    });
    // Add file inputs if any (skipping complex file handling for basic MVP, but API supports it)
    onSubmit(data);
  };

  // 손익비 자동 계산
  const entry = parseFloat(formData.entry);
  const tp = parseFloat(formData.tp);
  const sl = parseFloat(formData.sl);
  let rrRatio = 0;
  
  if (entry && tp && sl && entry !== sl) {
    const risk = Math.abs(entry - sl);
    const reward = Math.abs(tp - entry);
    rrRatio = (reward / risk).toFixed(2);
  }

  const renderSelect = (label, name, options) => (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{label}</label>
      <select name={name} value={formData[name]} onChange={handleChange} className="input-glass">
        {options.map(opt => <option key={opt} value={opt} style={{ background: 'var(--bg-main)' }}>{opt}</option>)}
      </select>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '32px' }}>
      <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        
        {/* 기본 정보 섹션 */}
        <div>
          <h3 className="heading-gradient" style={{ marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>1. 트레이드 셋업</h3>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>시나리오 제목</label>
            <input type="text" name="title" required value={formData.title} onChange={handleChange} className="input-glass" placeholder="ex) BTC 15m 눌림 롱" />
          </div>
          
          {renderSelect('포지션 (Side)', 'side', ['Long', 'Short'])}
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>진입가 (Entry)</label>
              <input type="number" step="any" name="entry" required value={formData.entry} onChange={handleChange} className="input-glass" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', color: 'var(--text-profit)' }}>목표가 (TP)</label>
              <input type="number" step="any" name="tp" required value={formData.tp} onChange={handleChange} className="input-glass" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', color: 'var(--loss-red)' }}>손절가 (SL)</label>
              <input type="number" step="any" name="sl" required value={formData.sl} onChange={handleChange} className="input-glass" />
            </div>
          </div>

          <div style={{ padding: '12px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', textAlign: 'center', marginBottom: '16px' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>예상 손익비 (R:R)</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: rrRatio >= 2 ? 'var(--profit-green)' : rrRatio > 0 ? '#F59E0B' : 'var(--text-muted)' }}>
              1 : {rrRatio > 0 ? rrRatio : '-'}
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>진입 근거 (최소 10자)</label>
            <textarea name="thesis" required minLength={10} value={formData.thesis} onChange={handleChange} className="input-glass" rows="4" placeholder="어떤 근거로 이 자리에 진입하나요?"></textarea>
          </div>
        </div>

        {/* 6단계 사고훈련 섹션 */}
        <div>
          <h3 className="heading-gradient" style={{ marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>2. 사고 훈련 (6단계)</h3>
          {renderSelect('1단계: 시장 추세', 'trend_choice', ['상승장 (Uptrend)', '하락장 (Downtrend)', '횡보장 (Ranging)'])}
          {renderSelect('2단계: 구조 (지/저)', 'structure_choice', ['지지/저항 돌파 (Breakout)', '지지/저항 리테스트 (Retest)', '추세선 지지/저항', '명확한 구조 없음'])}
          {renderSelect('3단계: 캔들 패턴', 'candle_choice', ['장대양봉/음봉 (Marubozu)', '핀바/망치형 (Pinbar)', '도지/팽이 (Doji)', '특이점 없음'])}
          {renderSelect('4단계: 거래량', 'volume_choice', ['거래량 급증 (Volume Spike)', '거래량 점진적 감소 (Drying Up)', '특이점 없음'])}
          {renderSelect('5단계: 보조지표', 'indicator_choice', ['이평선 정배열/역배열', 'RSI 다이버전스', 'MACD 크로스', '지표 참고 안함'])}
          {renderSelect('6단계: 종합 판단', 'final_choice', ['진입 근거 충족 (Valid Entry)', '확인 매매 필요 (Need Confirmation)', '관망 (Sit on Hands)'])}
        </div>

        {/* 심리 및 결과 섹션 */}
        <div>
          <h3 className="heading-gradient" style={{ marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>3. 심리 체크 및 결과</h3>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              <span>자신감 (1-10)</span>
              <span style={{ color: 'var(--accent-neon)' }}>{formData.confidence}</span>
            </label>
            <input type="range" name="confidence" min="1" max="10" value={formData.confidence} onChange={handleChange} style={{ width: '100%', accentColor: 'var(--accent-neon)' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>조급함 (0-5)</label>
              <input type="number" min="0" max="5" name="impatience" value={formData.impatience} onChange={handleChange} className="input-glass" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>복수심 (0-5)</label>
              <input type="number" min="0" max="5" name="revenge" value={formData.revenge} onChange={handleChange} className="input-glass" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>FOMO (0-5)</label>
              <input type="number" min="0" max="5" name="fomo" value={formData.fomo} onChange={handleChange} className="input-glass" />
            </div>
          </div>

          {renderSelect('최종 결과 (Outcome)', 'outcome', ['Planned Only', 'Win', 'Loss', 'Breakeven'])}

          {(formData.outcome === 'Win' || formData.outcome === 'Loss') && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: formData.outcome === 'Win' ? 'var(--profit-green)' : 'var(--loss-red)' }}>
                실제 수익률 (%)
              </label>
              <input type="number" step="0.1" name="pnl_percent" value={formData.pnl_percent} onChange={handleChange} className="input-glass" />
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              <input type="checkbox" name="stop_defined" checked={formData.stop_defined} onChange={handleChange} style={{ width: '18px', height: '18px', accentColor: 'var(--accent-neon)' }} />
              손절매(Stop Loss)를 명확히 설정했습니까?
            </label>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '32px', textAlign: 'center' }}>
        <button type="submit" disabled={isLoading} className="btn-primary" style={{ width: '100%', maxWidth: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: isLoading ? 0.7 : 1 }}>
          {isLoading ? (
            '분석 중입니다...'
          ) : (
            <>
              <Send size={18} />
              코치에게 분석 요청하기
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default TradeForm;
