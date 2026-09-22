/**
 * Backend for "108 Prasadam Naivedyam to Lord Vinayaka" sign-up.
 *
 * DEPLOY THIS ATTACHED TO YOUR GOOGLE SHEET:
 * https://docs.google.com/spreadsheets/d/1u5SHfGktuudQCAsObrlX0yHn5DN0NGs8AWTRMVmNr_o/edit
 *
 * Steps:
 * 1. Open the Sheet -> Extensions -> Apps Script.
 * 2. Delete any default code, paste this whole file in.
 * 3. Click "Deploy" -> "New deployment" -> type: "Web app".
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy the Web App URL and paste it into assets/config.js as API_URL.
 * 5. Re-deploy (Deploy -> Manage deployments -> Edit -> New version) any time
 *    you change this script.
 *
 * Sheet tab used: "Submissions" (auto-created with headers if missing).
 * Columns: Timestamp | Name | Mobile | Tower | Flat | ItemNumber | ItemName
 */

const SHEET_NAME = "Submissions";
const ADMIN_PASSWORD = "Ganesh2026";
const HEADERS = ["Timestamp", "Name", "Mobile", "Tower", "Flat", "ItemNumber", "ItemName"];

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function readAllSubmissions_() {
  const sheet = getSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const range = sheet.getRange(2, 1, lastRow - 1, HEADERS.length);
  const values = range.getValues();
  return values
    .filter((row) => row[1] || row[5]) // has a name or item number
    .map((row) => ({
      timestamp: row[0] instanceof Date ? row[0].toISOString() : String(row[0]),
      name: row[1],
      mobile: row[2],
      tower: row[3],
      flat: row[4],
      itemNumber: Number(row[5]),
      itemName: row[6],
    }));
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/**
 * GET
 *   ?action=list                -> public list of taken items (no personal-only leakage; per requirement flat number IS shown alongside item)
 *   ?action=admin&password=...  -> full submissions list for committee view
 */
function doGet(e) {
  const params = e.parameter || {};
  const action = params.action || "list";

  if (action === "admin") {
    if (params.password !== ADMIN_PASSWORD) {
      return jsonOut_({ ok: false, error: "Invalid password" });
    }
    return jsonOut_({ ok: true, submissions: readAllSubmissions_() });
  }

  // default: public list (name/mobile withheld, only item + flat + tower shown, per spec)
  const all = readAllSubmissions_();
  const publicList = all.map((s) => ({
    itemNumber: s.itemNumber,
    itemName: s.itemName,
    tower: s.tower,
    flat: s.flat,
  }));
  return jsonOut_({ ok: true, submissions: publicList });
}

/**
 * POST body (JSON): { name, mobile, tower, flat, itemNumber, itemName }
 * Server re-validates the item is not already taken (source of truth),
 * to prevent race conditions / duplicate submissions.
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
  } catch (err) {
    return jsonOut_({ ok: false, error: "Server busy, please try again." });
  }

  try {
    const data = JSON.parse(e.postData.contents);
    const name = (data.name || "").toString().trim();
    const mobile = (data.mobile || "").toString().trim();
    const tower = (data.tower || "").toString().trim();
    const flat = (data.flat || "").toString().trim();
    const itemNumber = Number(data.itemNumber);
    const itemName = (data.itemName || "").toString().trim();

    if (!name || !mobile || !tower || !flat || !itemNumber || !itemName) {
      return jsonOut_({ ok: false, error: "All fields are required." });
    }
    if (!/^[0-9]{10}$/.test(mobile)) {
      return jsonOut_({ ok: false, error: "Enter a valid 10-digit mobile number." });
    }

    const existing = readAllSubmissions_();

    // Prasadam item already claimed by someone else?
    const clash = existing.find((s) => s.itemNumber === itemNumber);
    if (clash) {
      return jsonOut_({
        ok: false,
        error:
          "This Prasadam (" +
          itemName +
          ") has already been taken by Flat " +
          clash.flat +
          ", Tower " +
          clash.tower +
          ". Please choose another item.",
      });
    }

    // Same resident (mobile) already submitted an item?
    const dupResident = existing.find((s) => s.mobile === mobile);
    if (dupResident) {
      return jsonOut_({
        ok: false,
        error:
          "This mobile number has already submitted Prasadam #" +
          dupResident.itemNumber +
          " (" +
          dupResident.itemName +
          "). One Prasadam per resident only.",
      });
    }

    const sheet = getSheet_();
    sheet.appendRow([new Date(), name, mobile, tower, flat, itemNumber, itemName]);

    return jsonOut_({ ok: true, message: "Submitted successfully!" });
  } catch (err) {
    return jsonOut_({ ok: false, error: "Unexpected error: " + err.message });
  } finally {
    lock.releaseLock();
  }
}
