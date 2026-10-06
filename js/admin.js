const SUPABASE_URL = 'https://nmwktpnsbwhgxkqmcaud.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_0v9XHkOALMZlg-cQHE6mCA_d_1j6xbE';
const ADMIN_USER_ID = '0b0b1f45-ea78-4ca1-a0ae-a8a53334680a';

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

    if (error || !profile?.is_admin || user.id !== ADMIN_USER_ID) {
      window.location.replace('perfil.html');
      return;
    }

    const form = document.getElementById('place-form');
    if (!form) return;

    const message = document.getElementById('place-message');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      message.textContent = 'Salvando...';

      const value = (id) => document.getElementById(id).value.trim();
      const data = {
        name: value('place-name'),
        category: value('place-category'),
        description: value('place-description'),
        image_url: value('place-image-url') || null,
        address: value('place-address'),
        neighborhood: value('place-neighborhood'),
        cep: value('place-cep') || null,
        maps_url: value('place-maps-url') || null,
        phone: value('place-phone') || null,
        whatsapp: value('place-whatsapp') || null,
        website: value('place-website') || null,
        instagram: value('place-instagram') || null,
        opening_days: value('place-opening-days') || null,
        opening_time: value('place-opening-time') || null,
        closing_time: value('place-closing-time') || null,
        price_range: value('place-price-range') || null,
        accessibility: document.getElementById('place-accessibility').checked
      };

      const { error: insertError } = await supabase.from('places').insert(data);

      if (insertError) {
        console.error('Cadastro do lugar:', insertError);
        message.textContent = 'Não foi possível adicionar o lugar. Tente novamente.';
        return;
      }

      form.reset();
      message.textContent = 'Lugar adicionado com sucesso!';
    });
  } catch (error) {
    console.error('Administração:', error);
    window.location.replace('perfil.html');
  }
});
