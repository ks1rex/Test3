"use strict";

// Замените значения на ваши реальные данные из Supabase → Project Settings → API
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function signUp(email, password) {
  return await supabaseClient.auth.signUp({ email, password });
}

async function signIn(email, password) {
  return await supabaseClient.auth.signInWithPassword({ email, password });
}

async function signOut() {
  return await supabaseClient.auth.signOut();
}

async function getSession() {
  const { data } = await supabaseClient.auth.getSession();
  return data.session;
}

async function checkAccess() {
  const session = await getSession();
  if (!session) return { loggedIn: false, hasAccess: false };

  const { data, error } = await supabaseClient
    .from('profiles')
    .select('has_access')
    .eq('id', session.user.id)
    .single();

  if (error || !data) return { loggedIn: true, hasAccess: false };
  return { loggedIn: true, hasAccess: data.has_access === true };
}

async function redeemCode(code) {
  const { data, error } = await supabaseClient.rpc('redeem_code', { code_input: code });
  if (error) return false;
  return data === true;
}
