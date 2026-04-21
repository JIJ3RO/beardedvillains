const anthropic = require('../config/anthropic');
const pool = require('../config/database');
const { toolDefinitions, toolMap } = require('../tools');
const { format } = require('date-fns');
const { toZonedTime } = require('date-fns-tz');

const TZ = () => process.env.BARBER_TIMEZONE || 'America/Mexico_City';
const MODEL = 'claude-sonnet-4-6';

function buildSystemPrompt(client, nowLocal) {
  const dateStr = format(nowLocal, "EEEE d 'de' MMMM 'de' yyyy, HH:mm", { locale: undefined });
  const vipNote = client?.is_vip
    ? 'Este cliente es VIP: puede agendar domingos y solicitar servicio a domicilio.'
    : 'Este cliente NO es VIP: no tiene acceso a domingos ni a servicio a domicilio.';

  const reliabilityNote =
    client && (client.cancellation_count >= 2 || client.noshow_count >= 1)
      ? `⚠️ ADVERTENCIA: Este cliente tiene ${client.cancellation_count} cancelación(es) y ${client.noshow_count} no-show(s). Antes de confirmar la cita, recuérdale amablemente su historial y confirma que esta vez sí asistirá.`
      : '';

  return `Eres el asistente virtual de una barbería. Ayudas a los clientes a agendar citas, consultar disponibilidad, cancelar o reagendar, y conocer los productos en venta.

Fecha y hora actual: ${dateStr} (${TZ()})
${vipNote}
${reliabilityNote}

REGLAS IMPORTANTES:
- Siempre confirma los detalles completos (servicio, fecha, hora, tipo) ANTES de llamar a create_appointment.
- Para domicilio, siempre pide la dirección antes de confirmar.
- Responde en el idioma que usa el cliente (español o inglés).
- Sé amable, conciso y directo. Evita mensajes largos.
- Nunca reveles IDs internos al cliente.
- Si el cliente responde "SÍ" o "SI" a una notificación de lista de espera, ofrece confirmar la cita inmediatamente.`.trim();
}

async function upsertClient(phone) {
  const { rows } = await pool.query(
    `INSERT INTO clients(phone) VALUES($1)
     ON CONFLICT(phone) DO UPDATE SET phone=EXCLUDED.phone
     RETURNING *`,
    [phone]
  );
  return rows[0];
}

async function getOrCreateConversation(phone) {
  const { rows } = await pool.query(
    `INSERT INTO conversations(client_phone) VALUES($1)
     ON CONFLICT(client_phone) DO UPDATE SET last_activity_at=NOW()
     RETURNING *`,
    [phone]
  );
  return rows[0];
}

async function saveMessages(phone, messages) {
  await pool.query(
    `UPDATE conversations SET messages=$1, last_activity_at=NOW() WHERE client_phone=$2`,
    [JSON.stringify(messages), phone]
  );
}

async function processMessage(customerPhone, incomingText) {
  const client = await upsertClient(customerPhone);
  const conv = await getOrCreateConversation(customerPhone);

  const messages = [...(conv.messages || []), { role: 'user', content: incomingText }];

  const ctx = {
    clientId: client.id,
    clientPhone: customerPhone,
    clientIsVip: client.is_vip,
  };

  const nowLocal = toZonedTime(new Date(), TZ());
  const systemPrompt = buildSystemPrompt(client, nowLocal);

  let response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    messages,
    tools: toolDefinitions,
  });

  // Agentic loop
  while (response.stop_reason === 'tool_use') {
    const assistantMsg = { role: 'assistant', content: response.content };
    messages.push(assistantMsg);

    const toolResults = [];
    for (const block of response.content) {
      if (block.type !== 'tool_use') continue;
      let result;
      try {
        const fn = toolMap[block.name];
        if (!fn) throw new Error(`Unknown tool: ${block.name}`);
        result = await fn(block.input, ctx);
      } catch (err) {
        result = { error: err.message };
      }
      toolResults.push({
        type: 'tool_result',
        tool_use_id: block.id,
        content: JSON.stringify(result),
      });
    }

    messages.push({ role: 'user', content: toolResults });

    response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages,
      tools: toolDefinitions,
    });
  }

  // Extract final text
  const finalText = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n');

  messages.push({ role: 'assistant', content: finalText });

  // Keep last 40 messages to avoid context bloat
  const trimmed = messages.slice(-40);
  await saveMessages(customerPhone, trimmed);

  return finalText;
}

module.exports = { processMessage };
