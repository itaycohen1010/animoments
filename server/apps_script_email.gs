// ===================================================================
// זכרונימציה — Google Apps Script: מייל מעוצב ללקוח + התראה אליכם
// חינם לחלוטין (Gmail, עד ~100 מיילים ביום)
// ---------------------------------------------------------------
// התקנה: script.google.com → New project → הדביקו הכול →
// Deploy → New deployment → Web app → Execute as: Me →
// Who has access: Anyone → Deploy → העתיקו את ה-URL
// החליפו את SITE_URL בכתובת האתר שלכם כשתהיה.
// ===================================================================

const SITE_URL = 'https://animoment.co.il';

// שער אבטחה: האתר שולח את הטוקן הזה בכל בקשה. חובה שיהיה זהה לערך שבאתר (config).
// זה חוסם שימוש לרעה מזדמן בכתובת ה-Web App (לא הגנה מוחלטת — הטוקן גלוי גם בקוד האתר).
const SCRIPT_TOKEN = 'am_9f3k2xQ7pL5vR8wZ1tB6nH0';

// בריחת תווי HTML כדי למנוע הזרקת קוד למייל דרך שם/טלפון/ברכה שהלקוח מקליד.
function esc(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// הריצו את הפונקציה הזו פעם אחת מהעורך (▶ Run) כדי לאשר הרשאות שליחת מייל.
// אם קיבלתם מייל "בדיקה — עובד!" — ההרשאות תקינות.
function testMail() {
  MailApp.sendEmail(Session.getEffectiveUser().getEmail(), 'בדיקה', 'עובד!');
}

function doPost(e) {
  const raw = JSON.parse(e.postData.contents);

  // שער טוקן — דוחים בקשות בלי הטוקן הנכון
  if (!raw || raw.token !== SCRIPT_TOKEN) {
    return ContentService.createTextOutput('forbidden');
  }

  // אימות שדות + הגבלת אורך + בריחת HTML
  const d = {
    order_id: esc(String(raw.order_id || '').slice(0, 20)),
    to_email: String(raw.to_email || '').slice(0, 120),
    to_name: esc(String(raw.to_name || '').slice(0, 80)),
    phone: esc(String(raw.phone || '').slice(0, 30)),
    package_name: esc(String(raw.package_name || '').slice(0, 60)),
    package_price: esc(String(raw.package_price || '').slice(0, 12)),
    music_mood: esc(String(raw.music_mood || '').slice(0, 40)),
    photo_count: esc(String(raw.photo_count || '').slice(0, 6)),
    order_date: esc(String(raw.order_date || '').slice(0, 40))
  };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.to_email)) {
    return ContentService.createTextOutput('bad email');
  }

  // ---------- מייל מעוצב ללקוח ----------
  const html =
  '<div dir="rtl" style="background:#EFE4D8;padding:24px 10px;font-family:Heebo,Arial,sans-serif">' +
   '<div style="max-width:620px;margin:0 auto;background:#FAF0E6;border-radius:8px;overflow:hidden">' +
    '<div style="background:#2E1F17;padding:26px 20px;text-align:center">' +
     '<div style="margin-bottom:14px;display:none">' +
      '<img src="' + SITE_URL + '/logo-mark.png" alt="זכרונימציה" width="66" height="66" style="width:66px;height:66px;border-radius:14px" />' +
     '</div>' +
     '<div style="color:#E8A13C;font-weight:900;font-size:24px">זִכְרוֹנִימַצְיָה</div>' +
     '<div style="color:rgba(250,240,230,.7);font-size:13px;margin-top:4px">הזכרונות שלכם — לסרטון מרגש</div>' +
    '</div>' +
    '<div style="padding:32px 28px;text-align:right">' +
     '<h1 style="margin:0 0 6px;color:#3B2A20;font-size:24px">תודה, ' + d.to_name + '! 🎉</h1>' +
     '<p style="margin:0 0 22px;color:#6E5240;font-size:15px;line-height:1.7">ההזמנה התקבלה ואנחנו כבר מתחילים לעבוד על הסרטון.</p>' +
     '<div style="background:#fff;border:1px solid #F0D9C4;border-radius:12px;padding:8px 20px;margin-bottom:22px">' +
      row('חבילה', d.package_name) +
      row('תאריך', d.order_date) +
      row('מספר הזמנה', d.order_id, true) +
     '</div>' +
     '<div style="background:#FBE4D7;border-radius:12px;padding:16px 20px;margin-bottom:22px">' +
      '<div style="font-weight:800;color:#A83E20;font-size:15px;margin-bottom:8px">מה עכשיו?</div>' +
      '<div style="color:#6E5240;font-size:14px;line-height:1.9">' +
       '⏳ אנחנו יוצרים את הסרטון שלכם — זה לוקח עד <b>48 שעות</b><br>' +
       '🧾 קבלה על התשלום תישלח אליכם ב-SMS בקרוב<br>' +
       '🌐 כשהוא מוכן נעדכן אתכם — הסרטון יהיה זמין באתר תחת ”הסרטון שלי“ עם מספר ההזמנה<br>' +
       '📞 יש שאלה? השיבו למייל הזה או שלחו לנו וואטסאפ ל-055-274-5188' +
      '</div>' +
     '</div>' +
     '<div style="text-align:center;margin-bottom:22px">' +
      '<a href="' + SITE_URL + '" style="display:inline-block;background:#C4502E;color:#fff;text-decoration:none;font-weight:800;font-size:15px;padding:13px 34px;border-radius:999px">לאתר שלנו</a>' +
      '<div style="color:#9A8979;font-size:12px;margin-top:8px;direction:ltr">' + SITE_URL + '</div>' +
     '</div>' +
     '<p style="margin:0;color:#9A8979;font-size:13px;text-align:center">נשלח באהבה מזכרונימציה ❤️</p>' +
    '</div>' +
   '</div>' +
  '</div>';

  MailApp.sendEmail({
    to: d.to_email,
    subject: 'ההזמנה שלכם התקבלה — הסרטון בדרך 🎬',
    name: 'זכרונימציה',
    replyTo: Session.getEffectiveUser().getEmail(),
    htmlBody: html,
    body: 'תודה, ' + d.to_name + '!\n\n' +
          'ההזמנה התקבלה ואנחנו כבר מתחילים לעבוד על הסרטון.\n\n' +
          'חבילה: ' + d.package_name + '\n' +
          'תאריך: ' + d.order_date + '\n\n' +
          'אנחנו יוצרים את הסרטון — זה לוקח עד 48 שעות. קבלה על התשלום תישלח אליכם ב-SMS בקרוב. כשהסרטון מוכן נעדכן אתכם, והוא יהיה זמין באתר תחת "הסרטון שלי" עם מספר ההזמנה.\n' +
          'יש שאלה? השיבו למייל הזה או שלחו לנו וואטסאפ ל-055-274-5188.\n\n' +
          'נשלח באהבה מזכרונימציה\n' + SITE_URL
  });

  // ---------- התראה אליכם ----------
  MailApp.sendEmail({
    to: Session.getEffectiveUser().getEmail(),
    subject: '🎬 הזמנה חדשה! ' + d.order_id + ' · ' + d.to_name,
    name: 'זכרונימציה',
    body: 'מספר הזמנה: ' + d.order_id + '\n' +
          'חבילה: ' + d.package_name + '\n' +
          'תחושת מוזיקה: ' + (d.music_mood || '(לא נבחר)') + '\n' +
          'תמונות: ' + d.photo_count + '\n' +
          'מייל: ' + d.to_email + '\n' +
          'טלפון: ' + d.phone + '\n' +
          'תאריך: ' + d.order_date
  });

  return ContentService.createTextOutput('ok');
}

function row(label, value, last) {
  return '<div style="padding:7px 0;' + (last ? '' : 'border-bottom:1px solid #F5EADC;') + 'color:#3B2A20;font-size:14px">' +
    '<span style="color:#9A8979">' + label + '</span>' +
    '<b style="float:left">' + value + '</b><div style="clear:both"></div></div>';
}
