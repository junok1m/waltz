import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export function useAuthSession() {
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  const retryAuth = useCallback(async () => {
    setAuthReady(false);
    setAuthError(false);

    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      setSession(data.session);
    } catch (error) {
      console.error("Unable to restore the Supabase session", error);
      setAuthError(true);
    } finally {
      setAuthReady(true);
    }
  }, []);

  useEffect(() => {
    void retryAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthError(false);
      setAuthReady(true);
    });

    return () => authListener.subscription.unsubscribe();
  }, [retryAuth]);

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert("Sign out failed", error.message);
  }

  return { authReady, authError, session, retryAuth, signOut };
}
