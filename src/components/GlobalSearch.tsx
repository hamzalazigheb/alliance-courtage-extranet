import React, { useState, useEffect, useRef } from 'react';
import { buildAPIURL } from '../api';

const SearchIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const UserIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const PartnerIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const FileIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

interface SearchResult {
  id: number;
  type: 'user' | 'partner' | 'archive' | 'document';
  title: string;
  subtitle?: string;
  category?: string;
}

interface GlobalSearchProps {
  onNavigate?: (tab: string, itemId?: number) => void;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ onNavigate }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close search on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch(query);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const searchLower = searchQuery.toLowerCase();
      const allResults: SearchResult[] = [];

      // Search Users
      const usersRes = await fetch(buildAPIURL('/users'), {
        headers: { 'x-auth-token': token }
      });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        const users = usersData.users || usersData || [];
        users
          .filter((u: any) => {
            const fullName = `${u.prenom} ${u.nom}`.toLowerCase();
            const email = u.email?.toLowerCase() || '';
            const denomination = u.denomination_sociale?.toLowerCase() || '';
            return fullName.includes(searchLower) || email.includes(searchLower) || denomination.includes(searchLower);
          })
          .forEach((u: any) => {
            allResults.push({
              id: u.id,
              type: 'user',
              title: u.denomination_sociale || `${u.prenom} ${u.nom}`,
              subtitle: u.email,
              category: 'Utilisateur'
            });
          });
      }

      // Search Partners
      const partnersRes = await fetch(buildAPIURL('/partners'), {
        headers: { 'x-auth-token': token }
      });
      if (partnersRes.ok) {
        const partnersData = await partnersRes.json();
        const partners = partnersData.partners || partnersData || [];
        partners
          .filter((p: any) => p.nom?.toLowerCase().includes(searchLower))
          .forEach((p: any) => {
            allResults.push({
              id: p.id,
              type: 'partner',
              title: p.nom,
              subtitle: p.category?.toUpperCase(),
              category: 'Partenaire'
            });
          });
      }

      // Search Archives
      const archivesRes = await fetch(buildAPIURL('/archives'), {
        headers: { 'x-auth-token': token }
      });
      if (archivesRes.ok) {
        const archives = await archivesRes.json();
        archives
          .filter((a: any) => a.title?.toLowerCase().includes(searchLower) || a.category?.toLowerCase().includes(searchLower))
          .forEach((a: any) => {
            allResults.push({
              id: a.id,
              type: 'archive',
              title: a.title,
              subtitle: a.category,
              category: 'Archive'
            });
          });
      }

      // Search Financial Documents
      const docsRes = await fetch(buildAPIURL('/financial-documents'), {
        headers: { 'x-auth-token': token }
      });
      if (docsRes.ok) {
        const docs = await docsRes.json();
        docs
          .filter((d: any) => d.title?.toLowerCase().includes(searchLower) || d.category?.toLowerCase().includes(searchLower))
          .forEach((d: any) => {
            allResults.push({
              id: d.id,
              type: 'document',
              title: d.title,
              subtitle: d.category,
              category: 'Document Financier'
            });
          });
      }

      setResults(allResults.slice(0, 10)); // Limit to 10 results
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'user': return <UserIcon className="w-4 h-4" />;
      case 'partner': return <PartnerIcon className="w-4 h-4" />;
      case 'archive': return <FileIcon className="w-4 h-4" />;
      case 'document': return <FileIcon className="w-4 h-4" />;
      default: return <FileIcon className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'user': return 'bg-blue-100 text-blue-700';
      case 'partner': return 'bg-purple-100 text-purple-700';
      case 'archive': return 'bg-indigo-100 text-indigo-700';
      case 'document': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleResultClick = (result: SearchResult) => {
    let tab = '';
    switch (result.type) {
      case 'user': tab = 'utilisateurs'; break;
      case 'partner': tab = 'partenaires'; break;
      case 'archive': tab = 'archives'; break;
      case 'document': tab = 'documents'; break;
    }
    
    if (onNavigate && tab) {
      onNavigate(tab, result.id);
    }
    
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl z-[9999]">
      {/* Search Input */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Rechercher utilisateurs, partenaires, documents... (Ctrl+K)"
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (query.trim().length >= 2 || results.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-2xl border border-gray-200 max-h-96 overflow-y-auto z-[9999]">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-2"></div>
              Recherche en cours...
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {query.trim().length < 2 ? 'Tapez au moins 2 caractères...' : 'Aucun résultat trouvé'}
            </div>
          ) : (
            <div className="py-2">
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}-${index}`}
                  onClick={() => handleResultClick(result)}
                  className="w-full px-4 py-3 hover:bg-gray-50 transition-colors text-left flex items-center space-x-3"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getTypeColor(result.type)}`}>
                    {getIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900 truncate">{result.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getTypeColor(result.type)}`}>
                        {result.category}
                      </span>
                    </div>
                    {result.subtitle && (
                      <p className="text-xs text-gray-500 truncate">{result.subtitle}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;

