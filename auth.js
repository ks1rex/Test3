"use strict";

// Замените значения на ваши реальные данные из Supabase → Project Settings → API
const SUPABASE_URL = 'https://bsmfzknssbjuggicmxgw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzbWZ6a25zc2JqdWdnaWNteGd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMTg1NjAsImV4cCI6MjA5NjY5NDU2MH0.PByAODC0E2wUKtKr7r3oAJrSRqfbuotjRPhiTyF8N9A';
const ADMIN_EMAIL = 'novyrusshian1@gmail.com';

// detectSessionInUrl: true (default) — SDK автоматически подхватывает ?code= (PKCE)
// или #access_token= (implicit) из URL при переходе по ссылке из письма.
// getSession() ждёт завершения этого обмена внутри _initialize(), поэтому
// вызов initAccess() сразу после загрузки страницы корректно получает сессию.
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function signUp(email, password) {
  return await supabaseClient.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: "https://ks1rex.github.io/Test3/" },
  });
}

async function signIn(email, password) {
  return await supabaseClient.auth.signInWithPassword({ email, password });
}

async function signOut() {
  return await supabaseClient.auth.signOut();
}

async function getSession() {
  const { data } = await supabaseClient.auth.getSession();
  // После успешного PKCE-обмена убираем ?code= из адресной строки,
  // чтобы повторный рефреш не пытался использовать уже отработавший код.
  if (data.session && window.location.search.includes('code=')) {
    const clean = window.location.pathname + window.location.hash;
    history.replaceState(null, '', clean);
  }
  return data.session;
}

async function checkAccess() {
  const session = await getSession();
  if (!session) return { loggedIn: false, hasAccess: false, expiresAt: null, unlimited: false, email: null };

  const { data, error } = await supabaseClient
    .from('profiles')
    .select('access_expires_at, unlimited_access')
    .eq('id', session.user.id)
    .single();

  if (error || !data) return { loggedIn: true, hasAccess: false, expiresAt: null, unlimited: false, email: session.user.email };

  const expiresAt = data.access_expires_at ?? null;
  const unlimited = data.unlimited_access === true;
  const hasAccess = unlimited || (expiresAt !== null && new Date(expiresAt) > new Date());
  return { loggedIn: true, hasAccess, expiresAt, unlimited, email: session.user.email };
}

async function redeemCode(code) {
  const { data, error } = await supabaseClient.rpc('redeem_code', { code_input: code });
  if (error) return false;
  return data === true;
}

async function resetPasswordForEmail(email) {
  return await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + window.location.pathname,
  });
}

async function updateUserPassword(password) {
  return await supabaseClient.auth.updateUser({ password });
}
