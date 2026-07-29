/**
 * Harmonic Myth Projection · inscripciones en Google Sheets
 *
 * Este script debe pegarse en Extensiones > Apps Script dentro de la hoja
 * "Inscripciones Harmonic Myth Projection".
 */

const CONFIG = {
  spreadsheetId: '1t9Rg5zJdnj80b-AwIOkJbpLOdmijovkmEBVxi59P7Ks',
  sheetName: 'Inscripciones',
  notificationEmail: 'info@harmonicbeacon.com',
  confirmationUrl: 'https://harmonicbeacon.com/inscripcion/confirmacion/',
  eventName: 'Harmonic Myth Projection',
  eventCode: 'hmp-2026-08-01',
  termsVersion: 'registration-v1'
};

const HEADERS = [
  'Fecha', 'Nombre', 'Apellido', 'Email', 'Sesión', 'Estado del pago', 'Origen',
  'Registration ID', 'Event Code', 'Session Code', 'Locale',
  'Versión términos inscripción', 'Aceptado términos inscripción', 'Actualizado'
];

/** Ejecutar una sola vez antes de publicar la aplicación web. */
function setup() {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.spreadsheetId);

  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', spreadsheet.getId());

  let sheet = spreadsheet.getSheetByName(CONFIG.sheetName);
  if (!sheet) sheet = spreadsheet.insertSheet(CONFIG.sheetName);

  if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  sheet.autoResizeColumns(1, HEADERS.length);
}

/** Recibe cada inscripción enviada por la landing. */
function doPost(event) {
  const data = event && event.parameter ? event.parameter : {};

  // Campo trampa para bots: las personas nunca lo completan.
  if (data._honey) return confirmationPage();

  const firstName = clean(data.firstName);
  const lastName = clean(data.lastName);
  const email = clean(data.email).toLowerCase();
  const session = clean(data.session);
  const eventCode = clean(data.eventCode);
  const sessionCode = clean(data.sessionCode);
  const locale = clean(data.locale);
  const termsVersion = clean(data.registrationTermsVersion);
  const termsAccepted = clean(data.registrationTermsAccepted);

  if (
    !firstName || !lastName || !isEmail(email) || !session ||
    eventCode !== CONFIG.eventCode || !sessionCode || !['es', 'en'].includes(locale) ||
    termsVersion !== CONFIG.termsVersion || termsAccepted !== 'ACEPTO'
  ) {
    return HtmlService.createHtmlOutput(
      '<h1>No pudimos guardar la inscripción</h1>' +
      '<p>Volvé al formulario y revisá los datos ingresados.</p>'
    );
  }

  const spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!spreadsheetId) throw new Error('Primero hay que ejecutar setup().');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(CONFIG.sheetName);
    const now = new Date().toISOString();
    sheet.appendRow([
      now,
      safeCell(firstName),
      safeCell(lastName),
      safeCell(email),
      safeCell(session),
      'Pendiente',
      'harmonicbeacon.com/inscripcion',
      Utilities.getUuid(),
      safeCell(eventCode),
      safeCell(sessionCode),
      safeCell(locale),
      safeCell(termsVersion),
      now,
      now
    ]);
  } finally {
    lock.releaseLock();
  }

  sendEmails({ firstName, lastName, email, session });
  return confirmationPage();
}

function sendEmails(registration) {
  const fullName = `${registration.firstName} ${registration.lastName}`;

  MailApp.sendEmail({
    to: CONFIG.notificationEmail,
    subject: `Nueva inscripción · ${CONFIG.eventName}`,
    body: `${fullName} se inscribió. Email: ${registration.email}. Sesión: ${registration.session}.`,
    htmlBody:
      `<p><strong>${escapeHtml(fullName)}</strong> se inscribió.</p>` +
      `<p>Email: ${escapeHtml(registration.email)}<br>` +
      `Sesión: ${escapeHtml(registration.session)}</p>` +
      '<p>La inscripción también quedó guardada en Google Sheets.</p>'
  });

  MailApp.sendEmail({
    to: registration.email,
    subject: `Recibimos tu inscripción · ${CONFIG.eventName}`,
    body: `Hola ${registration.firstName}. Recibimos tu inscripción a ${CONFIG.eventName}. Sesión elegida: ${registration.session}. En breve te enviaremos las instrucciones de pago y acceso.`,
    htmlBody:
      `<p>Hola ${escapeHtml(registration.firstName)},</p>` +
      `<p>Recibimos tu inscripción a <strong>${CONFIG.eventName}</strong>.</p>` +
      `<p>Sesión elegida: ${escapeHtml(registration.session)}.</p>` +
      '<p>En breve te enviaremos por correo las instrucciones de pago y el acceso a la sesión.</p>' +
      '<p>Gracias por cruzar el umbral con nosotros.</p>'
  });
}

function confirmationPage() {
  const url = CONFIG.confirmationUrl;
  return HtmlService.createHtmlOutput(
    '<!doctype html><html><head>' +
    `<meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${url}">` +
    `<script>location.replace(${JSON.stringify(url)})</script>` +
    '</head><body><p>Inscripción recibida. Redirigiendo…</p></body></html>'
  );
}

function clean(value) {
  return String(value || '').trim().slice(0, 500);
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function safeCell(value) {
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, function (character) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[character];
  });
}
