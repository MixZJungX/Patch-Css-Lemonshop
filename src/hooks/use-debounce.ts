import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook สำหรับ debounce function
 * @param callback - function ที่ต้องการ debounce
 * @param delay - ระยะเวลารอ (milliseconds)
 * @returns debounced function
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const debouncedCallback = ((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }) as T;

  return debouncedCallback;
}

/**
 * Hook สำหรับ debounce value
 * @param value - value ที่ต้องการ debounce
 * @param delay - ระยะเวลารอ (milliseconds)
 * @returns debounced value
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
