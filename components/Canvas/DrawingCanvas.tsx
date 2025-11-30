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
  const [isDrawing, setIsDrawing] = useState(false);
  const [internalIsErasing, setInternalIsErasing] = useState(false);
  
  // 외부에서 제어하는 경우와 내부에서 제어하는 경우 모두 지원
  const isErasing = externalIsErasing !== undefined ? externalIsErasing : internalIsErasing;
  const setIsErasing = (value: boolean) => {
    if (onErasingChange) {
      onErasingChange(value);
    } else {
      setInternalIsErasing(value);
    }
  };

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

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    return { x, y };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoordinates(e);

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoordinates(e);

    // 외부에서 전달된 isErasing 사용
    const currentIsErasing = externalIsErasing !== undefined ? externalIsErasing : internalIsErasing;
    
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
    
    // 이미지 데이터 업데이트 (그리는 동안에도 실시간으로 업데이트)
    if (onDrawingChange) {
      // requestAnimationFrame을 사용하여 성능 최적화
      requestAnimationFrame(() => {
        const imageData = canvas.toDataURL('image/png');
        onDrawingChange(imageData);
      });
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
  };

  const resetCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);
    
    if (onDrawingChange) {
      const imageData = canvas.toDataURL('image/png');
      onDrawingChange(imageData);
    }
  };

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
    <div className="w-full h-full">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full h-full cursor-crosshair bg-white"
        style={{ display: 'block' }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
    </div>
  );
}

// 외부에서 이미지 데이터를 가져올 수 있는 함수
export function getCanvasImageData(canvasRef: React.RefObject<HTMLCanvasElement>): string {
  if (!canvasRef.current) return '';
  return canvasRef.current.toDataURL('image/png');
}

