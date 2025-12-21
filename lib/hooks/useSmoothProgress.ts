import { useState, useEffect, useRef, startTransition } from "react";

/**
 * Хук для плавной интерполяции прогресса
 * Плавно анимирует переходы между значениями прогресса
 */
export function useSmoothProgress(
  targetProgress: number,
  targetStage: string,
  options: {
    /** Скорость интерполяции (0-1), чем больше, тем быстрее */
    speed?: number;
    /** Минимальная скорость изменения прогресса в %/мс */
    minSpeed?: number;
  } = {}
) {
  const { speed = 0.1, minSpeed = 0.5 } = options;
  const [displayProgress, setDisplayProgress] = useState(0);
  const [displayStage, setDisplayStage] = useState("");
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastUpdateTimeRef = useRef<number>(0);
  const currentProgressRef = useRef(0);

  useEffect(() => {
    // Обновляем стадию сразу (используем startTransition для избежания каскадных рендеров)
    startTransition(() => {
      setDisplayStage(targetStage);
    });

    // Если прогресс уменьшился (например, начали заново), обновляем сразу
    if (targetProgress < currentProgressRef.current) {
      currentProgressRef.current = targetProgress;
      startTransition(() => {
        setDisplayProgress(targetProgress);
      });
      return;
    }

    // Функция анимации
    const animate = () => {
      const now = Date.now();
      const deltaTime = now - lastUpdateTimeRef.current;
      lastUpdateTimeRef.current = now;

      const current = currentProgressRef.current;
      const target = targetProgress;
      const diff = target - current;

      // Если разница очень маленькая, сразу устанавливаем целевое значение
      if (Math.abs(diff) < 0.1) {
        currentProgressRef.current = target;
        setDisplayProgress(target);
        return;
      }

      // Плавная интерполяция с учетом времени
      // Используем экспоненциальное сглаживание для более естественного движения
      const progressStep = diff * speed;
      // Также учитываем минимальную скорость для плавности
      // Учитываем время между кадрами для более плавной анимации
      const normalizedDelta = Math.min(deltaTime / 16.67, 2); // Ограничиваем максимальный скачок
      const timeBasedStep = (minSpeed * normalizedDelta) / 10; // Нормализуем скорость
      const step = Math.max(progressStep, timeBasedStep);

      // Ограничиваем шаг, чтобы не было слишком резких скачков
      const maxStep = Math.abs(diff) * 0.3; // Максимум 30% от оставшегося пути за кадр
      const clampedStep = Math.min(step, maxStep);

      const newProgress = Math.min(current + clampedStep, target);
      currentProgressRef.current = newProgress;
      setDisplayProgress(newProgress);

      // Продолжаем анимацию, если еще не достигли цели
      if (newProgress < target) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    // Запускаем анимацию
    lastUpdateTimeRef.current = Date.now();
    animationFrameRef.current = requestAnimationFrame(animate);

    // Очистка при размонтировании
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [targetProgress, targetStage, speed, minSpeed]);

  return { progress: displayProgress, stage: displayStage };
}
