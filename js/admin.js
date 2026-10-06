const SUPABASE_URL = 'https://nmwktpnsbwhgxkqmcaud.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_0v9XHkOALMZlg-cQHE6mCA_d_1j6xbE';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/+esm');
    const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      window.location.replace('login.html');
      return;
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle();

    if (error || !profile?.is_admin) {
      window.location.replace('perfil.html');
    }
  } catch (error) {
    console.error('Verificação de administrador:', error);
    window.location.replace('perfil.html');
  }
});
