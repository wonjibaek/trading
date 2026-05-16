import React, { useState } from 'react';
import { HelpCircle, CheckCircle2, XCircle, Award, ArrowRight, RotateCcw } from 'lucide-react';

const QUIZ_DATA = [
  {
    id: 1,
    question: "비트코인이 주요 저항선을 강한 거래량과 함께 돌파했습니다. 이때 가장 적절한 대응은?",
    options: [
      "즉시 풀매수(All-in) 한다.",
      "추격 매수보다는 리테스트(Retest) 지지를 확인하고 진입한다.",
      "너무 올랐으므로 즉시 숏(Short) 포지션을 잡는다.",
      "거래량이 터졌으므로 무시한다."
    ],
    answer: 1,
    explanation: "강한 돌파 후에는 해당 저항선이 지지선으로 바뀌는지 확인하는 '리테스트' 과정에서 진입하는 것이 리스크 관리 측면에서 가장 유리합니다."
  },
  {
    id: 2,
    question: "RSI 지표가 80을 넘어서 과매수 구간에 진입했습니다. 이것의 의미는?",
    options: [
      "무조건 곧 폭락할 것이라는 뜻이다.",
      "매수세가 매우 강하다는 뜻이며, 추세가 연장될 수 있음을 유의해야 한다.",
      "지금 바로 팔아야 한다는 절대적인 신호이다.",
      "지표가 고장 났다는 뜻이다."
    ],
    answer: 1,
    explanation: "RSI 과매수는 매수세의 강함을 나타내기도 합니다. 강한 추세장에서는 과매수 상태로 오랫동안 상승이 지속될 수 있으므로 단독 매도 신호로 쓰기엔 위험합니다."
  },
  {
    id: 3,
    question: "손익비(R:R) 1:2 전략을 사용할 때, 승률이 몇 % 이상이면 계좌가 우상향할까요?",
    options: [
      "20% 이상",
      "33% 초과",
      "50% 이상",
      "70% 이상"
    ],
    answer: 1,
    explanation: "손익비가 1:2라면, 1번 이길 때 2를 벌고 2번 질 때 2를 잃습니다. 즉, 3번 중 1번(33.3%)만 이겨도 본전이며, 그 이상이면 수익이 발생합니다."
  },
  {
    id: 4,
    question: "다이버전스(Divergence) 현상이란 무엇을 의미하나요?",
    options: [
      "가격과 지표의 방향이 일치하는 현상",
      "가격은 고점을 높이는데, 지표의 고점은 낮아지는 등 가격과 지표가 따로 노는 현상",
      "거래량이 급감하는 현상",
      "갑자기 가격이 횡보하는 현상"
    ],
    answer: 1,
    explanation: "가격의 움직임과 보조지표(RSI, MACD 등)의 움직임이 반대로 나타나는 현상으로, 추세 반전의 강력한 신호로 해석되곤 합니다."
  }
];

const TradingQuiz = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const handleOptionClick = (index) => {
    if (isSubmitted) return;
    setSelectedOption(index);
  };

  const handleSubmit = () => {
    if (selectedOption === null) return;
    if (selectedOption === QUIZ_DATA[currentStep].answer) {
      setScore(score + 1);
    }
    setIsSubmitted(true);
  };

  const handleNext = () => {
    if (currentStep < QUIZ_DATA.length - 1) {
      setCurrentStep(currentStep + 1);
      setSelectedOption(null);
      setIsSubmitted(false);
    } else {
      setShowResult(true);
    }
  };

  const resetQuiz = () => {
    setCurrentStep(0);
    setScore(0);
    setSelectedOption(null);
    setIsSubmitted(false);
    setShowResult(false);
  };

  if (showResult) {
    return (
      <div className="glass-panel animate-slide-up" style={{ padding: '40px', textAlign: 'center' }}>
        <Award size={64} className="text-profit" style={{ marginBottom: '20px' }} />
        <h2 className="heading-gradient" style={{ fontSize: '2rem', marginBottom: '10px' }}>퀴즈 완료!</h2>
        <p style={{ fontSize: '1.2rem', marginBottom: '30px' }}>
          총 {QUIZ_DATA.length}문제 중 <strong>{score}문제</strong>를 맞혔습니다.
        </p>
        <button className="btn-primary" onClick={resetQuiz} style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto' }}>
          <RotateCcw size={18} /> 다시 도전하기
        </button>
      </div>
    );
  }

  const currentQuiz = QUIZ_DATA[currentStep];

  return (
    <div className="animate-slide-up" style={{ maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HelpCircle size={20} className="text-profit" />
          <span style={{ fontWeight: '600' }}>트레이딩 실력 점검 퀴즈</span>
        </div>
        <span className="text-muted" style={{ fontSize: '0.9rem' }}>
          {currentStep + 1} / {QUIZ_DATA.length}
        </span>
      </div>

      <div className="glass-panel" style={{ padding: '30px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '24px', lineHeight: '1.5' }}>
          {currentQuiz.question}
        </h3>

        <div style={{ display: 'grid', gap: '12px' }}>
          {currentQuiz.options.map((option, index) => {
            let bgColor = 'rgba(255, 255, 255, 0.03)';
            let borderColor = 'rgba(255, 255, 255, 0.1)';
            
            if (isSubmitted) {
              if (index === currentQuiz.answer) {
                bgColor = 'rgba(16, 185, 129, 0.1)';
                borderColor = 'var(--profit-green)';
              } else if (index === selectedOption) {
                bgColor = 'rgba(239, 68, 68, 0.1)';
                borderColor = 'var(--loss-red)';
              }
            } else if (selectedOption === index) {
              borderColor = 'var(--accent-neon)';
              bgColor = 'rgba(0, 210, 255, 0.05)';
            }

            return (
              <div 
                key={index}
                onClick={() => handleOptionClick(index)}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: `1px solid ${borderColor}`,
                  background: bgColor,
                  cursor: isSubmitted ? 'default' : 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div style={{
                  width: '24px', height: '24px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)',
                  display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '0.8rem',
                  borderColor: selectedOption === index ? 'var(--accent-neon)' : 'rgba(255,255,255,0.2)'
                }}>
                  {index + 1}
                </div>
                {option}
              </div>
            );
          })}
        </div>
      </div>

      {isSubmitted && (
        <div className="animate-slide-up" style={{ 
          padding: '20px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', 
          borderLeft: `4px solid ${selectedOption === currentQuiz.answer ? 'var(--profit-green)' : 'var(--loss-red)'}`,
          marginBottom: '20px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {selectedOption === currentQuiz.answer ? 
              <><CheckCircle2 size={18} className="text-profit" /> 정답입니다!</> : 
              <><XCircle size={18} className="text-loss" /> 아쉽네요. 정답은 {currentQuiz.answer + 1}번입니다.</>
            }
          </div>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>{currentQuiz.explanation}</p>
        </div>
      )}

      <div style={{ textAlign: 'right' }}>
        {!isSubmitted ? (
          <button 
            className="btn-primary" 
            disabled={selectedOption === null}
            onClick={handleSubmit}
            style={{ padding: '12px 30px' }}
          >
            정답 제출
          </button>
        ) : (
          <button 
            className="btn-primary" 
            onClick={handleNext}
            style={{ padding: '12px 30px', display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}
          >
            {currentStep === QUIZ_DATA.length - 1 ? '결과 보기' : '다음 문제'} <ArrowRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

export default TradingQuiz;
