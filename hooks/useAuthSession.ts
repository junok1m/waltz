import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export function useAuthSession() {
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const signOutInFlight = useRef(false);

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
    if (signOutInFlight.current) return;
    signOutInFlight.current = true;
    setIsSigningOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) Alert.alert("Sign out failed", error.message);
    } catch (error) {
      Alert.alert("Sign out failed", error instanceof Error ? error.message : "Check your connection and try again.");
    } finally {
      signOutInFlight.current = false;
      setIsSigningOut(false);
    }
  }

  return { authReady, authError, session, isSigningOut, retryAuth, signOut };
}
