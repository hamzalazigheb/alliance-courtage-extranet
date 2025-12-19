import { useState, useEffect, useRef } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  onLoad?: () => void;
  style?: React.CSSProperties;
}

/**
 * Composant d'image avec lazy loading pour améliorer les performances
 */
export default function LazyImage({ 
  src, 
  alt, 
  className = '', 
  placeholder,
  onError,
  onLoad,
  style 
}: LazyImageProps) {
  const [imageSrc, setImageSrc] = useState<string>(placeholder || '');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Commencer à charger 50px avant que l'image soit visible
        threshold: 0.01
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (isInView && src) {
      const img = new Image();
      img.src = src;
      
      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
        if (onLoad) onLoad();
      };
      
      img.onerror = (e) => {
        if (onError) {
          const syntheticEvent = {
            target: imgRef.current,
            currentTarget: imgRef.current,
          } as React.SyntheticEvent<HTMLImageElement, Event>;
          onError(syntheticEvent);
        }
      };
    }
  }, [isInView, src, onError, onLoad]);

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={`${className} ${!isLoaded ? 'opacity-0 transition-opacity duration-300' : 'opacity-100'}`}
      style={style}
      loading="lazy"
      decoding="async"
    />
  );
}

