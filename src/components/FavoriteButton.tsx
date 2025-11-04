import React, { useState, useEffect } from 'react';
import { favorisAPI } from '../api';

interface FavoriteButtonProps {
  itemType: string;
  itemId: number;
  title: string;
  description?: string;
  url?: string;
  metadata?: any;
  className?: string;
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  itemType,
  itemId,
  title,
  description = '',
  url = '',
  metadata = null,
  className = ''
}) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkFavoriteStatus();
  }, [itemType, itemId]);

  const checkFavoriteStatus = async () => {
    try {
      setChecking(true);
      const result = await favorisAPI.check(itemType, itemId);
      setIsFavorite(result.isFavorite);
    } catch (error) {
      console.error('Error checking favorite status:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (isLoading || checking) return;

    try {
      setIsLoading(true);
      
      if (isFavorite) {
        await favorisAPI.removeByItem(itemType, itemId);
        setIsFavorite(false);
      } else {
        await favorisAPI.add(itemType, itemId, title, description, url, metadata);
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert('Erreur lors de l\'ajout/retrait des favoris');
    } finally {
      setIsLoading(false);
    }
  };

  if (checking) {
    return (
      <button
        className={`p-2 rounded-lg transition-all ${className}`}
        disabled
      >
        <svg className="w-5 h-5 text-gray-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      </button>
    );
  }

  return (
    <button
      onClick={handleToggleFavorite}
      disabled={isLoading}
      className={`p-2 rounded-lg transition-all ${
        isFavorite
          ? 'text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50'
          : 'text-gray-400 hover:text-yellow-500 hover:bg-gray-100'
      } ${className}`}
      title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
    >
      <svg 
        className={`w-5 h-5 transition-all ${isFavorite ? 'fill-current' : ''}`} 
        fill={isFavorite ? 'currentColor' : 'none'} 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" 
        />
      </svg>
    </button>
  );
};

export default FavoriteButton;

