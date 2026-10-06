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
    const imageInput = document.getElementById('place-images');
    const imagePreview = document.getElementById('image-preview');
    const imageCount = document.getElementById('image-count');
    const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];

    imageInput.addEventListener('change', () => {
      imagePreview.innerHTML = '';
      const files = [...imageInput.files];
      imageCount.textContent = files.length
        ? files.length + (files.length === 1 ? ' imagem selecionada' : ' imagens selecionadas')
        : 'Nenhuma imagem selecionada';

      files.forEach((file) => {
        const figure = document.createElement('figure');
        const img = document.createElement('img');
        const caption = document.createElement('figcaption');

        img.src = URL.createObjectURL(file);
        img.alt = file.name;
        caption.textContent = file.name;

        figure.appendChild(img);
        figure.appendChild(caption);
        imagePreview.appendChild(figure);
      });
    });

    const category = document.getElementById('place-category');
    const customCategoryLabel = document.getElementById('custom-category-label');
    const customCategory = document.getElementById('place-custom-category');

    const updateCategory = () => {
      const isOther = category.value === 'Outros';
      customCategoryLabel.hidden = !isOther;
      customCategoryLabel.style.display = isOther ? 'block' : 'none';
      customCategory.required = isOther;
      if (!isOther) customCategory.value = '';
    };

    category.addEventListener('change', updateCategory);
    updateCategory();

    const cep = document.getElementById('place-cep');
    const address = document.getElementById('place-address');
    const neighborhood = document.getElementById('place-neighborhood');
    const city = document.getElementById('place-city');
    const state = document.getElementById('place-state');
    const cepMessage = document.getElementById('cep-message');

    const formatCep = (value) => {
      const digits = value.replace(/\D/g, '').slice(0, 8);
      return digits.length > 5 ? digits.slice(0, 5) + '-' + digits.slice(5) : digits;
    };

    let cepTimeout;
    cep.addEventListener('input', () => {
      cep.value = formatCep(cep.value);
      clearTimeout(cepTimeout);
      cepMessage.textContent = '';

      if (cep.value.replace(/\D/g, '').length === 8) {
        cepTimeout = setTimeout(async () => {
          cepMessage.textContent = 'Consultando CEP...';
          try {
            const response = await fetch('https://viacep.com.br/ws/' + cep.value.replace(/\D/g, '') + '/json/');
            const data = await response.json();

            if (data.erro) {
              cepMessage.textContent = 'CEP não encontrado.';
              return;
            }

            address.value = data.logradouro || '';
            neighborhood.value = data.bairro || '';
            city.value = data.localidade || '';
            state.value = data.uf || '';
            cepMessage.textContent = 'Endereço preenchido automaticamente.';
          } catch (error) {
            console.error('Consulta CEP:', error);
            cepMessage.textContent = 'Não foi possível consultar o CEP.';
          }
        }, 250);
      }
    });

    const priceInput = document.getElementById('place-price-range');
    priceInput.addEventListener('input', () => {
      let digits = priceInput.value.replace(/\D/g, '').slice(0, 9);

      if (!digits) {
        priceInput.value = '';
        return;
      }

      digits = digits.padStart(3, '0');
      const cents = digits.slice(-2);
      const reais = digits.slice(0, -2).replace(/^0+(?=\d)/, '');
      priceInput.value = reais + ',' + cents;
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      message.textContent = 'Salvando...';

      const value = (id) => document.getElementById(id).value.trim();
      const selectedDays = [...form.querySelectorAll('input[name="opening_day"]:checked')]
        .map(input => input.value);

      const selectedCategory = value('place-category');
      const finalCategory = selectedCategory === 'Outros'
        ? value('place-custom-category')
        : selectedCategory;

      const priceDigits = value('place-price-range').replace(/\D/g, '');
      const priceValue = priceDigits
        ? (Number(priceDigits) / 100).toFixed(2)
        : null;

      const addressNumber = value('place-address-number');
      const fullAddress = addressNumber
        ? value('place-address') + ', ' + addressNumber
        : value('place-address');

      const data = {
        name: value('place-name'),
        category: finalCategory,
        description: value('place-description'),
        image_url: null,
        image_urls: [],
        address: fullAddress,
        neighborhood: value('place-neighborhood'),
        cep: value('place-cep') || null,
        maps_url: value('place-maps-url') || null,
        phone: value('place-phone') || null,
        whatsapp: value('place-whatsapp') || null,
        website: value('place-website') || null,
        instagram: value('place-instagram') || null,
        opening_days: selectedDays.length ? selectedDays.join(', ') : null,
        opening_time: value('place-opening-time') || null,
        closing_time: value('place-closing-time') || null,
        price_range: priceValue,
        accessibility: document.getElementById('place-accessibility').checked
      };

      const files = [...imageInput.files];

      for (const file of files) {
        if (!allowedImageTypes.includes(file.type) || file.size > MAX_IMAGE_SIZE) {
          message.textContent = 'Cada imagem precisa ser JPG, PNG ou WebP e ter no máximo 5 MB.';
          return;
        }
      }

      const { data: insertedPlace, error: insertError } = await supabase
        .from('places')
        .insert(data)
        .select('id')
        .single();

      if (insertError) {
        console.error('Cadastro do lugar:', insertError);
        message.textContent = 'Não foi possível adicionar o lugar. Tente novamente.';
        return;
      }

      const uploadedUrls = [];

      try {
        for (const file of files) {
          const safeName = file.name
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9._-]/g, '-');

          const filePath = insertedPlace.id + '/' + Date.now() + '-' + crypto.randomUUID() + '-' + safeName;

          const { error: uploadError } = await supabase
            .storage
            .from('place-images')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false,
              contentType: file.type
            });

          if (uploadError) throw uploadError;

          const { data: publicUrlData } = supabase
            .storage
            .from('place-images')
            .getPublicUrl(filePath);

          uploadedUrls.push(publicUrlData.publicUrl);
        }

        if (uploadedUrls.length) {
          const { error: imageUpdateError } = await supabase
            .from('places')
            .update({
              image_url: uploadedUrls[0],
              image_urls: uploadedUrls
            })
            .eq('id', insertedPlace.id);

          if (imageUpdateError) throw imageUpdateError;
        }
      } catch (imageError) {
        console.error('Upload das imagens:', imageError);
        message.textContent = 'O lugar foi criado, mas não foi possível enviar todas as imagens.';
        return;
      }

      form.reset();
      imagePreview.innerHTML = '';
      imageCount.textContent = 'Nenhuma imagem selecionada';
      updateCategory();
      city.value = '';
      state.value = '';
      cepMessage.textContent = '';
      message.textContent = 'Lugar adicionado com sucesso!';
    });
  } catch (error) {
    console.error('Administração:', error);
    window.location.replace('perfil.html');
  }
});