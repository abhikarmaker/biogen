import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getUser, getToken, removeAvatarUri, removeDisplayName } from '../services/storage';
import { getUserProfile } from '../services/api';
import { logout as authLogout } from '../services/auth';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [savedBios, setSavedBios] = useState([]);

  const loadUser = useCallback(async () => {
    try {
      // Restore session from local storage first so the app never flashes the auth screen
      const [token, stored] = await Promise.all([getToken(), getUser()]);

      if (!token || !stored) {
        // No stored session — show auth screen
        return;
      }

      // Immediately mark as authenticated with cached data
      setUser(stored);
      setIsAuthenticated(true);

      // If we have a real JWT (not local-session), fetch fresh profile in the background
      if (token !== 'local-session') {
        try {
          const fresh = await getUserProfile();
          setUser(fresh);
        } catch { /* backend down — keep cached user */ }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    const uid = user?.id;
    await authLogout();
    if (uid) {
      await Promise.all([removeAvatarUri(uid), removeDisplayName(uid)]);
    }
    setUser(null);
    setIsAuthenticated(false);
    setSavedBios([]);
  };

  const refreshUser = async () => {
    try {
      const fresh = await getUserProfile();
      setUser(fresh);
      return fresh;
    } catch {
      return user;
    }
  };

  const incrementBioCount = () => {
    setUser((prev) => prev ? { ...prev, bio_count: (prev.bio_count || 0) + 1 } : prev);
  };

  const upgradeToPro = () => {
    setUser((prev) => prev ? { ...prev, plan: 'pro' } : prev);
  };

  const addBio = (bio) => {
    setSavedBios((prev) => [bio, ...prev]);
  };

  const removeBio = (id) => {
    setSavedBios((prev) => prev.filter((b) => b.id !== id));
  };

  const isPro = user?.plan === 'pro';
  const biosUsed = user?.bio_count || 0;
  const freeLimit = user?.free_limit || 3;
  const canGenerate = isPro || biosUsed < freeLimit;

  // Compute when the 12-hour free quota resets
  const resetAt = user?.bio_count_reset_at
    ? new Date(new Date(user.bio_count_reset_at).getTime() + 12 * 60 * 60 * 1000)
    : null;
  const quotaResetsAt = (!isPro && biosUsed >= freeLimit) ? resetAt : null;

  return (
    <UserContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        isPro,
        biosUsed,
        freeLimit,
        canGenerate,
        quotaResetsAt,
        savedBios,
        login,
        logout,
        refreshUser,
        incrementBioCount,
        upgradeToPro,
        addBio,
        removeBio,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used inside UserProvider');
  return ctx;
}

export { UserContext };
