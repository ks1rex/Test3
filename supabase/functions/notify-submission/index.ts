import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!;
const TELEGRAM_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID')!;

const TG_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return new Response('method not allowed', { status: 405 });
  }

  const body = await req.json();
  const record = body?.record ?? body;

  const {
    user_email = '—',
    file_path,
    original_filename = file_path ?? '—',
    topic_hint = '—',
    comment = '',
  } = record ?? {};

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Download the file from Storage
  let fileData: Blob | null = null;
  let fileError = false;
  if (file_path) {
    const { data, error } = await supabase.storage
      .from('submissions')
      .download(file_path);
    if (error || !data) {
      fileError = true;
    } else {
      fileData = data;
    }
  } else {
    fileError = true;
  }

  // Build the text message
  const commentLine = comment ? `\n💬 Комментарий: ${comment}` : '';
  const fileNote = fileError ? '\n\n⚠️ Файл не удалось прикрепить.' : '';
  const text =
    `📥 Новая заявка\n` +
    `📚 Тема: ${topic_hint}\n` +
    `📎 Файл: ${original_filename}\n` +
    `👤 Email: ${user_email}` +
    commentLine +
    fileNote;

  // sendMessage
  await fetch(`${TG_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text,
    }),
  });

  // sendDocument (only if file was downloaded)
  if (fileData) {
    const form = new FormData();
    form.append('chat_id', TELEGRAM_CHAT_ID);
    form.append('document', fileData, original_filename);

    const captionLine = comment ? `\n💬 ${comment}` : '';
    form.append(
      'caption',
      `${topic_hint} — ${user_email}` + captionLine,
    );

    await fetch(`${TG_API}/sendDocument`, {
      method: 'POST',
      body: form,
    });
  }

  return new Response('ok', { status: 200 });
});
