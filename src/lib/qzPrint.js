// frontend/src/lib/qzPrint.js
//
// Direct thermal printing via QZ Tray (https://qz.io) — a small desktop
// app that must be installed and running on the till computer. Once
// running, this lets the browser send raw ESC/POS commands straight to
// the MP58-15 (or any printer QZ Tray can see), with no print dialog.
//
// Setup required on the till computer (one-time):
//   1. Install QZ Tray from https://qz.io/download/ and run it — it sits
//      in the system tray, must be running whenever you want to print.
//   2. The first time this site connects, QZ Tray will show a one-time
//      "Allow this website to connect?" popup — click Allow (and check
//      "Remember this decision" so it doesn't ask again). This project
//      uses QZ Tray unsigned, which is fine for a single internal till —
//      if you want to remove that popup entirely, QZ Tray supports a
//      signed certificate, which is a separate, optional upgrade.
//   3. That's it — the "Print to Thermal Printer" button will now print
//      directly to the printer QZ Tray finds (see findPrinter() below).

const RECEIPT_WIDTH = 32; // characters per line — standard for 58mm paper, Font A

const ESC = '\x1B';
const GS = '\x1D';

function isQzAvailable() {
  return typeof window !== 'undefined' && !!window.qz;
}

async function ensureConnected() {
  if (!isQzAvailable()) {
    throw new Error('QZ Tray is not detected. Install and run QZ Tray from qz.io, then try again.');
  }
  if (window.qz.websocket.isActive()) return;

  // Unsigned mode — QZ Tray will show its own one-time "Allow?" prompt on
  // the till computer instead of requiring a signed certificate here.
  window.qz.security.setCertificatePromise((resolve) => resolve());
  window.qz.security.setSignaturePromise(() => (resolve) => resolve());

  try {
    await window.qz.websocket.connect();
  } catch (err) {
    throw new Error(`Couldn't connect to QZ Tray: ${err.message || err}. Make sure QZ Tray is running on this computer.`);
  }
}

/** Finds the MP58-15 by name if QZ Tray sees it under that name; otherwise
 * falls back to whatever printer is set as the system default. */
async function findPrinter() {
  try {
    const found = await window.qz.printers.find('MP58');
    if (found) return found;
  } catch { /* not found by that name — fall through to default */ }
  return window.qz.printers.getDefault();
}

function padLine(left, right = '') {
  const space = Math.max(1, RECEIPT_WIDTH - left.length - right.length);
  return left + ' '.repeat(space) + right;
}

function wrapText(text, width = RECEIPT_WIDTH) {
  const words = String(text).split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > width) { lines.push(line.trim()); line = w; }
    else line = (line + ' ' + w).trim();
  }
  if (line) lines.push(line);
  return lines;
}

const naira = (n) => `N${Number(n || 0).toLocaleString('en-NG')}`; // thermal printers often lack a ₦ glyph — 'N' prints reliably everywhere

/**
 * Builds the raw ESC/POS command sequence for one receipt. Returns an
 * array of strings, exactly the shape QZ Tray's qz.print() expects for a
 * 'raw' print job.
 */
function buildReceiptCommands(order, business) {
  const cmds = [];
  const center = () => cmds.push(ESC + 'a' + '\x01');
  const left = () => cmds.push(ESC + 'a' + '\x00');
  const bold = (on) => cmds.push(ESC + 'E' + (on ? '\x01' : '\x00'));
  const big = (on) => cmds.push(GS + '!' + (on ? '\x11' : '\x00'));
  const line = (text = '') => cmds.push(text + '\n');
  const divider = () => line('-'.repeat(RECEIPT_WIDTH));

  cmds.push(ESC + '@'); // initialize printer

  center();
  bold(true); big(true);
  line(business?.name || 'Solohans Delicious Meals');
  big(false); bold(false);
  if (business?.tagline) line(business.tagline);
  if (business?.address) wrapText(business.address).forEach(line);
  if (business?.phone) line(business.phone);
  if (business?.email) line(business.email);
  divider();

  left();
  line(padLine('Order:', order.order_id || ''));
  if (order.invoiceNumber) line(padLine('Invoice:', order.invoiceNumber));
  line(padLine('Date:', new Date(order.createdAt).toLocaleString('en-NG')));
  line(padLine('Customer:', order.customerName || 'Walk-in'));
  if (order.platform && order.platform !== 'Walk-in') {
    line(padLine('Platform:', `${order.platform} #${order.externalOrderId || ''}`));
  }
  divider();

  // Items — name on its own line if long, qty x price aligned right
  const items = [];
  (order.items || []).forEach((i) => items.push({ name: i.name, qty: i.quantity || 1, total: i.total ?? (i.price || 0) * (i.quantity || 1) }));
  (order.mealPackages || []).forEach((m) => items.push({ name: m.label || m.name || 'Meal Package', qty: m.quantity || 1, total: m.total ?? ((m.unitPrice ?? m.price ?? 0) * (m.quantity || 1)) }));
  (order.storeExtras || []).forEach((e) => items.push({ name: e.label || e.item || 'Extra', qty: e.qty || e.quantity || 1, total: e.total ?? ((e.unitPrice ?? e.price ?? 0) * (e.qty || e.quantity || 1)) }));

  items.forEach((it) => {
    const qtyTag = it.qty > 1 ? ` x${it.qty}` : '';
    wrapText(it.name + qtyTag, RECEIPT_WIDTH).forEach((l, idx, arr) => {
      if (idx === arr.length - 1) line(padLine(l, naira(it.total)));
      else line(l);
    });
  });
  divider();

  if (order.items_subtotal > 0) line(padLine('Subtotal', naira(order.items_subtotal)));
  if (order.discount_amount > 0) line(padLine(order.discount_label || 'Discount', `-${naira(order.discount_amount)}`));
  if (order.tax_amount > 0) line(padLine(`VAT (${order.tax_rate}%)`, naira(order.tax_amount)));
  if (order.delivery_fee > 0) line(padLine('Delivery Fee', naira(order.delivery_fee)));

  bold(true); big(true);
  line(padLine('TOTAL', naira(order.totalAmount)));
  big(false); bold(false);
  divider();

  line(padLine('Payment:', order.paymentMethod === 'PLATFORM' ? (order.platform || 'Platform') : (order.paymentMethod || '—')));
  line(padLine('Payment Status:', order.payment_status || 'unpaid'));
  if (order.status) line(padLine('Order Status:', order.status));

  line();
  center();
  line(`Thank you for choosing ${business?.name || 'Solohans'}!`);
  line();
  line();
  line();

  cmds.push(GS + 'V' + '\x41' + '\x03'); // full paper cut

  return cmds;
}

/**
 * Prints a receipt directly to the thermal printer via QZ Tray.
 * Throws a descriptive Error if QZ Tray isn't running/connected, or if no
 * printer could be found — the caller should catch this and fall back to
 * window.print() (standard browser printing) as a safety net.
 */
export async function printReceiptToThermalPrinter(order, business) {
  await ensureConnected();

  const printer = await findPrinter();
  if (!printer) {
    throw new Error('QZ Tray is running but no printer was found. Make sure the MP58-15 is installed and turned on.');
  }

  const config = window.qz.configs.create(printer);
  const data = buildReceiptCommands(order, business);
  await window.qz.print(config, data);
}

export { isQzAvailable };