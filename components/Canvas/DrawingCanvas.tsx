'use client';

import { useRef, useEffect, useState } from 'react';

interface DrawingCanvasProps {
  width?: number;
  height?: number;
  onDrawingChange?: (imageData: string) => void;
  isErasing?: boolean;
  onErasingChange?: (isErasing: boolean) => void;
}

export default function DrawingCanvas({
  width = 800,
  height = 600,
  onDrawingChange,
  isErasing: externalIsErasing,
  onErasingChange,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const [internalIsErasing, setInternalIsErasing] = useState(false);
  
  // 외부에서 제어하는 경우와 내부에서 제어하는 경우 모두 지원
  const isErasing = externalIsErasing !== undefined ? externalIsErasing : internalIsErasing;

  // 최신 props/state를 ref에 저장 (이벤트 리스너 재등록 없이 최신 값 참조)
  const onDrawingChangeRef = useRef(onDrawingChange);
  const externalIsErasingRef = useRef(externalIsErasing);
  const internalIsErasingRef = useRef(internalIsErasing);
  
  useEffect(() => {
    onDrawingChangeRef.current = onDrawingChange;
  }, [onDrawingChange]);
  
  useEffect(() => {
    externalIsErasingRef.current = externalIsErasing;
  }, [externalIsErasing]);
  
  useEffect(() => {
    internalIsErasingRef.current = internalIsErasing;
  }, [internalIsErasing]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 캔버스 초기 설정
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [width, height]);

  // 터치 및 마우스 이벤트 리스너 (한 번만 등록, ref로 최신 값 참조)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getCoords = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    };

    const startDrawing = (clientX: number, clientY: number) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { x, y } = getCoords(clientX, clientY);
      isDrawingRef.current = true;
      ctx.beginPath();
      ctx.moveTo(x, y);
    };

    const draw = (clientX: number, clientY: number) => {
      if (!isDrawingRef.current) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { x, y } = getCoords(clientX, clientY);

      // ref에서 최신 isErasing 값 참조
      const currentIsErasing = externalIsErasingRef.current !== undefined 
        ? externalIsErasingRef.current 
        : internalIsErasingRef.current;
      
      if (currentIsErasing) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = 20;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'black';
      }

      ctx.lineTo(x, y);
      ctx.stroke();
      
      // ref에서 최신 onDrawingChange 참조
      const callback = onDrawingChangeRef.current;
      if (callback) {
        requestAnimationFrame(() => {
          const imageData = canvas.toDataURL('image/png');
          callback(imageData);
        });
      }
    };

    const stopDrawing = () => {
      isDrawingRef.current = false;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
      }
    };

    // 마우스 이벤트 핸들러
    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      startDrawing(e.clientX, e.clientY);
    };

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      draw(e.clientX, e.clientY);
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      stopDrawing();
    };

    const handleMouseLeave = () => {
      stopDrawing();
    };

    // 터치 이벤트 핸들러
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const touch = e.touches[0];
      if (touch) {
        startDrawing(touch.clientX, touch.clientY);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const touch = e.touches[0];
      if (touch) {
        draw(touch.clientX, touch.clientY);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      stopDrawing();
    };

    // 이벤트 리스너 추가 (passive: false로 설정해야 preventDefault가 작동함)
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    // 클린업
    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, []); // ← 빈 의존성: 이벤트 리스너는 한 번만 등록

  const getImageData = (): string => {
    const canvas = canvasRef.current;
    if (!canvas) return '';
    return canvas.toDataURL('image/png');
  };

  // 외부에서 접근 가능하도록 ref 노출
  useEffect(() => {
    if (canvasRef.current) {
      (canvasRef.current as any).getImageData = getImageData;
    }
  }, []);

  return (
    <div 
      className="w-full h-full"
      style={{ touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full h-full cursor-crosshair bg-white"
        style={{ 
          display: 'block', 
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
        }}
      />
    </div>
  );
}

// 외부에서 이미지 데이터를 가져올 수 있는 함수
export function getCanvasImageData(canvasRef: React.RefObject<HTMLCanvasElement>): string {
  if (!canvasRef.current) return '';
  return canvasRef.current.toDataURL('image/png');
}
