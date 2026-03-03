const SPREADSHEET_ID = 'PASTE_YOUR_GOOGLE_SHEET_ID_HERE';
const SYLLABUS_SHEET = 'Syllabus';
const CONTENT_SHEET = 'Content';

function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('Maharashtra Board Learning Portal')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function include(fileName) {
  return HtmlService.createHtmlOutputFromFile(fileName).getContent();
}

function getSyllabus() {
  const rows = getSheetRows_(SYLLABUS_SHEET);
  return rows
    .filter((r) => r.Class && r.Subject && r.Chapter)
    .sort((a, b) => Number(a.Order || 999) - Number(b.Order || 999));
}

function getClasses() {
  const rows = getSyllabus();
  const classes = [...new Set(rows.map((r) => String(r.Class).trim()))];
  return classes.sort((a, b) => Number(a) - Number(b));
}

function getSubjectsForClass(selectedClass) {
  const rows = getSyllabus().filter((r) => String(r.Class) === String(selectedClass));
  return [...new Set(rows.map((r) => r.Subject))].sort();
}

function getChapters(selectedClass, selectedSubject) {
  return getSyllabus()
    .filter((r) => String(r.Class) === String(selectedClass) && r.Subject === selectedSubject)
    .map((r) => ({
      chapter: r.Chapter,
      order: Number(r.Order || 999),
    }))
    .sort((a, b) => a.order - b.order);
}

function getChapterContent(selectedClass, selectedSubject, selectedChapter) {
  const rows = getSheetRows_(CONTENT_SHEET);
  return rows.filter((r) => {
    return (
      String(r.Class) === String(selectedClass) &&
      r.Subject === selectedSubject &&
      r.Chapter === selectedChapter
    );
  });
}

function getChapterBundle(selectedClass, selectedSubject, selectedChapter) {
  const rows = getChapterContent(selectedClass, selectedSubject, selectedChapter);

  const bundle = {
    learn: [],
    practice: [],
    experiment: [],
    revision: [],
  };

  rows.forEach((row) => {
    const section = String(row.Section || '').toLowerCase();
    if (!bundle[section]) return;

    const item = {
      contentType: row.ContentType || '',
      question: row.Question || '',
      options: parseOptions_(row.Options),
      correctAnswer: row.CorrectAnswer || '',
      explanation: row.Explanation || '',
      resourceURL: row.ResourceURL || '',
    };

    bundle[section].push(item);
  });

  return bundle;
}

function parseOptions_(raw) {
  if (!raw) return [];
  return String(raw)
    .split('|')
    .map((opt) => opt.trim())
    .filter(Boolean);
}

function getSheetRows_(sheetName) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error('Missing sheet: ' + sheetName);
  }

  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  const headers = values[0].map((h) => String(h).trim());
  return values.slice(1).map((row) => {
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = row[i];
    });
    return obj;
  });
}
