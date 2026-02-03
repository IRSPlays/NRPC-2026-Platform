import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../lib/api';

interface AuthContextType {
  isAdmin: boolean;
  isJudge: boolean;
  isTeam: boolean;
  isLoading: boolean;
  teamId: string | null;
  teamName: string | null;
  loginAsAdmin: (password: string) => Promise<void>;
  loginAsJudge: (password: string) => Promise<void>;
  loginAsTeam: (teamId: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isJudge, setIsJudge] = useState(false);
  const [isTeam, setIsTeam] = useState(false);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    setIsLoading(true);
    try {
      const status = await authAPI.checkStatus();
      setIsAdmin(status.isAdmin);
      setIsJudge(status.isJudge);
      setIsTeam(!!status.teamId);
      setTeamId(status.teamId);
    } catch (_) {
      setIsAdmin(false);
      setIsJudge(false);
      setIsTeam(false);
      setTeamId(null);
      setTeamName(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const loginAsAdmin = async (password: string) => {
    await authAPI.adminLogin(password);
    await checkAuth();
  };

  const loginAsJudge = async (password: string) => {
    await authAPI.judgeLogin(password);
    await checkAuth();
  };

  const loginAsTeam = async (id: string, password: string) => {
    const result = await authAPI.teamLogin(id, password);
    if (result.success) {
      setTeamName(result.team.name);
      await checkAuth();
    }
  };

  const logout = async () => {
    await authAPI.logout();
    setIsAdmin(false);
    setIsJudge(false);
    setIsTeam(false);
    setTeamId(null);
    setTeamName(null);
  };

  return (
    <AuthContext.Provider value={{
      isAdmin,
      isJudge,
      isTeam,
      isLoading,
      teamId,
      teamName,
      loginAsAdmin,
      loginAsJudge,
      loginAsTeam,
      logout,
      checkAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}