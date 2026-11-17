import nodemailer from 'npm:nodemailer@10.6.0';

declare const EdgeRuntime: { waitUntil(task: Promise<unknown>): void };

const siteOrigin = Deno.env.get('ENQUIRY_SITE_ORIGIN') || 'https://berkshire.nz';
const projectUrl = Deno.env.get('SUPABASE_URL');
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const mailUser = Deno.env.get('SMTP_USER');
const mailPassword = Deno.env.get('SMTP_APP_PASSWORD')?.replace(/\s/g, '');
const recipient = Deno.env.get('LEAD_NOTIFY_TO');

const mailer = mailUser && mailPassword && recipient
  ? nodemailer.createTransport({
    host: Deno.env.get('SMTP_HOST') || 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: mailUser, pass: mailPassword },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 20000,
    disableFileAccess: true,
    disableUrlAccess: true,
  })
  : null;

type PendingEnquiry = {
  id: string;
  first_name: string;
  email: string;
  phone: string;
  message: string;
  notification_attempts: number;
};

const cors = {
  'Access-Control-Allow-Origin': siteOrigin,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Vary': 'Origin',
};

function respond(status: number, body: object, headers: HeadersInit = cors) {
  return Response.json(body, { status, headers });
}

async function databaseRequest<T>(path: string, body: object, method = 'POST'): Promise<T> {
  if (!projectUrl || !serviceKey) throw new Error('Database configuration is missing');
  const response = await fetch(`${projectUrl}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error(`Database status ${response.status}`);
  }
  return response.status === 204 ? undefined as T : await response.json();
}

async function readFields(request: Request): Promise<Record<string, unknown>> {
  if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json' || !request.body) {
    throw new Error('Expected a JSON body');
  }
  const reader = request.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let size = 0;
  let text = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 16000) throw new Error('Request too large');
      text += decoder.decode(value, { stream: true });
    }
    const data = JSON.parse(text + decoder.decode());
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid form fields');
    return data;
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  } finally {
    reader.releaseLock();
  }
}

async function requestFingerprint(request: Request) {
  if (!serviceKey) throw new Error('Database configuration is missing');
  const encoder = new TextEncoder();
  const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-real-ip') || 'unknown';
  const key = await crypto.subtle.importKey('raw', encoder.encode(serviceKey), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(ip));
  return Array.from(new Uint8Array(signature), byte => byte.toString(16).padStart(2, '0')).join('');
}

async function sendNotifications(enquiryId: string | null, retryToken: string | null) {
  if (!mailer || !mailUser || !recipient) {
    console.warn('Enquiry SMTP settings are missing');
    return;
  }
  const pending = await databaseRequest<PendingEnquiry[]>('rpc/claim_berkshire_enquiry_notifications', {
    enquiry_id: enquiryId,
    retry_token: retryToken,
  });
  await Promise.all(pending.map(async (enquiry) => {
    try {
      const sent = await mailer.sendMail({
        from: { name: 'Berkshire Architects website', address: mailUser },
        to: recipient,
        replyTo: { address: enquiry.email },
        messageId: `<${enquiry.id}@berkshire.nz>`,
        subject: 'New Berkshire Architects enquiry',
        text: [
          `First name: ${enquiry.first_name}`,
          `Email: ${enquiry.email}`,
          `Contact number: ${enquiry.phone}`,
          '',
          enquiry.message,
        ].join('\n'),
      });
      if (!sent.accepted.length) throw new Error('Recipient not accepted');
      await databaseRequest(
        `berkshire_enquiries?id=eq.${enquiry.id}&notification_attempts=eq.${enquiry.notification_attempts}`,
        { notification_sent_at: new Date().toISOString() },
        'PATCH',
      );
    } catch {
      console.error('Enquiry notification failed. The record remains available for retry.');
    }
  }));
}

Deno.serve(async (request) => {
  const retryToken = request.headers.get('x-enquiry-retry-token');
  if (request.method === 'POST' && retryToken && /^[0-9a-f]{64}$/.test(retryToken)) {
    try {
      await sendNotifications(null, retryToken);
      return new Response(null, { status: 204 });
    } catch (error) {
      if (error instanceof Error && error.message === 'Database status 403') return respond(403, {}, {});
      return respond(503, {}, {});
    }
  }

  if (request.headers.get('origin') !== siteOrigin) return respond(403, {}, {});
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (request.method !== 'POST') return respond(405, {});

  let fields: Record<string, unknown>;
  try {
    fields = await readFields(request);
  } catch {
    return respond(400, {});
  }
  if (fields.website) return respond(200, { received: true });

  const name = typeof fields.name === 'string' ? fields.name.trim() : '';
  const email = typeof fields.email === 'string' ? fields.email.trim() : '';
  const phone = typeof fields.phone === 'string' ? fields.phone.trim() : '';
  const message = typeof fields.message === 'string' ? fields.message.trim() : '';
  const submissionId = typeof fields.submissionId === 'string' ? fields.submissionId : '';
  const digits = phone.replace(/\D/g, '').length;
  if (!name || name.length > 100 || /[\x00-\x1f\x7f]/.test(name) ||
      email.length > 254 || !/^[\w.!#$%&'*+/=?^{}|~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(email) ||
      phone.length > 32 || digits < 7 || digits > 15 || !/^[0-9+() .-]+$/.test(phone) ||
      !message || message.length > 2000 || message.includes('\0') ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(submissionId)) {
    return respond(400, {});
  }

  try {
    const result = await databaseRequest<string>('rpc/record_berkshire_enquiry', {
      enquiry_id: submissionId,
      given_name: name,
      contact_email: email,
      contact_phone: phone,
      project_message: message,
      fingerprint: await requestFingerprint(request),
    });
    if (result === 'limited') return respond(429, {});
    if (result === 'conflict') return respond(409, {});
    if (result !== 'received') return respond(503, {});

    const notification = sendNotifications(submissionId, null).catch(() => {
      console.error('Enquiry notification processing could not start');
    });
    if (typeof EdgeRuntime === 'undefined') await notification;
    else EdgeRuntime.waitUntil(notification);

    return respond(200, { received: true });
  } catch {
    console.error('Enquiry record could not be saved');
    return respond(503, {});
  }
});
