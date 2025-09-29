import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { AuthContext } from './AuthContext';

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [authError, setAuthError] = useState(null);

	useEffect(() => {
		let subscription;

		const init = async () => {
			try {
				const { data, error } = await supabase.auth.getSession();
				if (error) throw error;
				setUser(data?.session?.user ?? null);
			} catch (e) {
				setAuthError(e.message || 'Auth init failed');
				setUser(null);
			} finally {
				setLoading(false);
			}

			const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
				setUser(session?.user ?? null);
			});
			subscription = listener?.subscription;
		};

		init();

		return () => {
			subscription?.unsubscribe?.();
		};
	}, []);

	const login = async (email, password) => {
		const { error } = await supabase.auth.signInWithPassword({ email, password });
		if (error) setAuthError(error.message);
		return { error };
	};

	const logout = async () => {
		const { error } = await supabase.auth.signOut();
		if (error) setAuthError(error.message);
		return { error };
	};

	const value = useMemo(
		() => ({ user, loading, authError, login, logout }),
		[user, loading, authError]
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};