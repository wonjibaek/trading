import { RefreshCw, TrendingUp, AlertTriangle, ShieldCheck } from 'lucide-react';

const FeedbackResult = ({ data, onReset }) => {
  const { 
    title, 
    score, 
    classification, 
    feedback, 
    reason_points,
    step_points,
    step_notes,
    rr
  } = data;

  // 점수에 따른 색상 및 아이콘 결정
  const getScoreStyle = (score) => {
    if (score >= 80) return { color: 'var(--profit-green)', glow: 'rgba(16, 185, 129, 0.2)' };
    if (score >= 60) return { color: '#F59E0B', glow: 'rgba(245, 158, 11, 0.2)' };
    return { color: 'var(--loss-red)', glow: 'rgba(239, 68, 68, 0.2)' };
  };

  const scoreStyle = getScoreStyle(score);

  return (
    <div className="glass-panel" style={{ padding: '32px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '8px' }}>{title}</h2>
        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', padding: '24px 48px', background: 'rgba(0,0,0,0.4)', borderRadius: '24px', border: `1px solid ${scoreStyle.color}`, boxShadow: `0 0 32px ${scoreStyle.glow}` }}>
          <span style={{ fontSize: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px' }}>종합 평가 등급</span>
          <div style={{ fontSize: '4rem', fontWeight: '800', color: scoreStyle.color, lineHeight: '1.1', textShadow: `0 0 20px ${scoreStyle.glow}` }}>
            {classification}
          </div>
          <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{score}점</span>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: '1fr 1fr' }}>
        {/* 점수 산정 로직 */}
        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--accent-neon)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} />
            심리 및 기준 평가내역
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.95rem' }}>
            {reason_points.map((reason, idx) => {
              const isPositive = reason.includes('+');
              const isNegative = reason.includes('-');
              return (
                <li key={idx} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', color: isPositive ? 'var(--profit-green)' : isNegative ? 'var(--loss-red)' : 'var(--text-main)', display: 'flex', justifyContent: 'space-between' }}>
                  {reason}
                </li>
              );
            })}
          </ul>
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>손익비 (R:R): <span style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>1 : {rr}</span></div>
          </div>
        </div>

        {/* 6단계 훈련 내역 */}
        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--accent-blue)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={18} />
            사고 훈련 (6단계) 피드백
          </h3>
          <div style={{ marginBottom: '12px', fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
            가산점: +{step_points}점
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            {step_notes.map((note, idx) => (
              <li key={idx} style={{ padding: '6px 0', display: 'flex', gap: '8px' }}>
                <span style={{ color: 'var(--accent-blue)' }}>•</span> {note}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* AI 코칭 피드백 */}
      <div style={{ marginTop: '24px', background: 'linear-gradient(to right, rgba(59, 130, 246, 0.1), rgba(0, 0, 0, 0.2))', padding: '24px', borderRadius: '16px', borderLeft: '4px solid var(--accent-blue)' }}>
        <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={18} color="var(--accent-neon)" />
          트레이딩 코치 종합 코멘트
        </h3>
        <p style={{ fontSize: '1rem', lineHeight: '1.7', color: 'var(--text-main)', whiteSpace: 'pre-line' }}>
          {feedback}
        </p>
      </div>

      <div style={{ marginTop: '32px', textAlign: 'center' }}>
        <button onClick={onReset} className="btn-primary" style={{ background: 'rgba(255,255,255,0.1)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <RefreshCw size={18} />
          새로운 트레이드 기록하기
        </button>
      </div>
    </div>
  );
};

export default FeedbackResult;
