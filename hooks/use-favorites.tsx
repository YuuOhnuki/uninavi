'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { University } from '@/components/layout/UniversityCard';

interface FavoritesContextValue {
    favorites: University[];
    isFavorite: (university: University) => boolean;
    toggleFavorite: (university: University) => void;
    clearFavorites: () => void;
    syncFavorite: (university: University) => void;
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

const STORAGE_KEY = 'uninavi:favorites';

type UniversityKey = string;

function getUniversityKey(university: University): UniversityKey {
    const facultyPart = university.faculty ?? '';
    const examTypePart = university.examType ?? '';
    return `${university.id}::${facultyPart}::${examTypePart}`;
}

export function FavoritesProvider({ children }: { children: React.ReactNode }): React.ReactElement {
    const [favorites, setFavorites] = useState<University[]>([]);
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        try {
            const stored = window.localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);

                if (Array.isArray(parsed)) {
                    if (parsed.length === 0) {
                        setFavorites([]);
                    } else if (typeof parsed[0] === 'string') {
                        // Legacy format stored only university IDs. Clear to avoid inconsistent state.
                        setFavorites([]);
                    } else {
                        setFavorites(parsed as University[]);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to read favorites from localStorage:', error);
        } finally {
            setIsHydrated(true);
        }
    }, []);

    useEffect(() => {
        if (!isHydrated || typeof window === 'undefined') {
            return;
        }

        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
        } catch (error) {
            console.error('Failed to persist favorites to localStorage:', error);
        }
    }, [favorites, isHydrated]);

    const toggleFavorite = useCallback((university: University) => {
        setFavorites((prev) => {
            const key = getUniversityKey(university);
            const exists = prev.some((item) => getUniversityKey(item) === key);

            if (exists) {
                return prev.filter((item) => getUniversityKey(item) !== key);
            }

            return [...prev, university];
        });
    }, []);

    const isFavorite = useCallback(
        (university: University) => favorites.some((item) => getUniversityKey(item) === getUniversityKey(university)),
        [favorites]
    );

    const syncFavorite = useCallback((university: University) => {
        setFavorites((prev) => {
            const key = getUniversityKey(university);
            let updated = false;

            const next = prev.map((item) => {
                if (getUniversityKey(item) === key) {
                    updated = true;
                    return university;
                }
                return item;
            });

            return updated ? next : prev;
        });
    }, []);

    const clearFavorites = useCallback(() => {
        setFavorites([]);
    }, []);

    const value = useMemo<FavoritesContextValue>(
        () => ({
            favorites,
            toggleFavorite,
            isFavorite,
            clearFavorites,
            syncFavorite,
        }),
        [favorites, toggleFavorite, isFavorite, clearFavorites, syncFavorite]
    );

    return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
    const context = useContext(FavoritesContext);
    if (context === undefined) {
        throw new Error('useFavorites must be used within a FavoritesProvider');
    }

    return context;
}
