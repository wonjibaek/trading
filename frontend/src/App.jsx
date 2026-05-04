import { useState } from 'react'
import TradeForm from './components/TradeForm'
import FeedbackResult from './components/FeedbackResult'
import GuideCharts from './components/GuideCharts'
import './index.css'

function App() {
  const [feedback, setFeedback] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 현재 브라우저의 주소(IP)를 자동으로 알아내어 백엔드 주소로 사용합니다.
  const BASE_URL = window.location.origin;
  const API_URL = `${BASE_URL}/api/trades`; 
      
      const response = await fetch(API_URL, {
        method: "POST",
        body: formData, 
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
    <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
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
          <GuideCharts apiUrl={`${BASE_URL}/api`} />
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
