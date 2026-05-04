import { useState } from 'react'
import TradeForm from './components/TradeForm'
import FeedbackResult from './components/FeedbackResult'
import './index.css'

function App() {
  const [feedback, setFeedback] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 이 함수가 자식 컴포넌트(TradeForm)에서 호출되어 백엔드로 데이터를 쏩니다.
  const handleTradeSubmit = async (formData) => {
    setIsLoading(true);
    setError(null);
    try {
      // 🚨 나중에 실제 네이버 클라우드 서버 IP로 변경해야 합니다!
      const API_URL = "http://49.50.134.197:8000/api/trades"; 
      
      const response = await fetch(API_URL, {
        method: "POST",
        body: formData, // FormData 객체를 그대로 전송 (멀티파트)
      });

      if (!response.ok) {
        throw new Error("서버와의 통신에 실패했습니다.");
      }

      const result = await response.json();
      setFeedback(result);
    } catch (err) {
      console.error(err);
      setError("데이터를 분석하는 중 오류가 발생했습니다. 서버가 켜져있는지 확인해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFeedback(null);
  };

  return (
    <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
      <header style={{ textAlign: 'center', marginBottom: '40px' }} className="animate-slide-up">
        <h1 className="heading-gradient" style={{ fontSize: '2.5rem', marginBottom: '8px' }}>
          Trading Insight Pro
        </h1>
        <p className="text-muted">완벽한 복기를 위한 당신만의 AI 트레이딩 코치</p>
      </header>

      {error && (
        <div className="glass-panel" style={{ padding: '16px', marginBottom: '24px', borderLeft: '4px solid var(--loss-red)' }}>
          <p className="text-loss">{error}</p>
        </div>
      )}

      {!feedback ? (
        <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <TradeForm onSubmit={handleTradeSubmit} isLoading={isLoading} />
        </div>
      ) : (
        <div className="animate-slide-up">
          <FeedbackResult data={feedback} onReset={handleReset} />
        </div>
      )}
    </div>
  )
}

export default App
