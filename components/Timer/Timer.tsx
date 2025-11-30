'use client';

import { useEffect, useState } from 'react';
import React from 'react';

interface TimerProps {
  initialSeconds: number;
  onTimeUp: () => void;
  isRunning: boolean;
}

export default function Timer({ initialSeconds, onTimeUp, isRunning }: TimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const hasStartedRef = React.useRef<boolean>(false);
  const onTimeUpRef = React.useRef(onTimeUp);

  // onTimeUp 콜백을 ref에 저장하여 변경되지 않도록 함
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  // isRunning이 false에서 true로 변경될 때만 타이머 시작
  useEffect(() => {
    if (!isRunning) {
      // 타이머가 멈추면 인터벌만 정리하고 초기화하지 않음
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      hasStartedRef.current = false;
      return;
    }

    // 이미 타이머가 시작되어 있으면 재시작하지 않음
    if (hasStartedRef.current && intervalRef.current) {
      return;
    }

    // 타이머 시작 (한 번만)
    hasStartedRef.current = true;
    setSeconds(initialSeconds);
    
    intervalRef.current = setInterval(() => {
      setSeconds((prev) => {
        const newSeconds = prev - 1;
        if (newSeconds <= 0) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          hasStartedRef.current = false;
          // setTimeout으로 감싸서 비동기로 호출 (React 상태 업데이트 중 다른 컴포넌트 업데이트 방지)
          setTimeout(() => {
            onTimeUpRef.current();
          }, 0);
          return 0;
        }
        return newSeconds;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, initialSeconds]); // onTimeUp 제거

  const percentage = (seconds / initialSeconds) * 100;
  const isWarning = seconds <= 3;

  // MM:SS 형식으로 변환
  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2">
      <div 
        className="text-lg font-semibold px-3 py-1 rounded bg-gray-100"
        style={{ color: isWarning ? '#ef4444' : '#374151' }}
      >
        {formatTime(seconds)}
      </div>
    </div>
  );
}

