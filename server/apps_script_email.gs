// ===================================================================
// זכרונימציה — Google Apps Script: מייל מעוצב ללקוח + התראה אליכם
// חינם לחלוטין (Gmail, עד ~100 מיילים ביום)
// ---------------------------------------------------------------
// התקנה: script.google.com → New project → הדביקו הכול →
// Deploy → New deployment → Web app → Execute as: Me →
// Who has access: Anyone → Deploy → העתיקו את ה-URL
// החליפו את SITE_URL בכתובת האתר שלכם כשתהיה.
// ===================================================================

const SITE_URL = 'https://YOUR-SITE-URL.co.il';

// הריצו את הפונקציה הזו פעם אחת מהעורך (▶ Run) כדי לאשר הרשאות שליחת מייל.
// אם קיבלתם מייל "בדיקה — עובד!" — ההרשאות תקינות.
function testMail() {
  MailApp.sendEmail(Session.getEffectiveUser().getEmail(), 'בדיקה', 'עובד!');
}

function doPost(e) {
  const d = JSON.parse(e.postData.contents);

  // ---------- מייל מעוצב ללקוח ----------
  const html =
  '<div dir="rtl" style="background:#EFE4D8;padding:24px 10px;font-family:Heebo,Arial,sans-serif">' +
   '<div style="max-width:620px;margin:0 auto;background:#FAF0E6;border-radius:8px;overflow:hidden">' +
    '<div style="background:#2E1F17;padding:26px 20px;text-align:center">' +
     '<div style="margin-bottom:14px">' +
      '<span style="display:inline-block;width:34px;height:24px;background:#4a352a;border-radius:3px;margin:0 3px"></span>' +
      '<span style="display:inline-block;width:34px;height:24px;background:#C4502E;border-radius:3px;margin:0 3px"></span>' +
      '<span style="display:inline-block;width:34px;height:24px;background:#E8A13C;border-radius:3px;margin:0 3px"></span>' +
      '<span style="display:inline-block;width:34px;height:24px;background:#4a352a;border-radius:3px;margin:0 3px"></span>' +
     '</div>' +
     '<div style="color:#E8A13C;font-weight:900;font-size:24px">זִכְרוֹנִימַצְיָה</div>' +
     '<div style="color:rgba(250,240,230,.7);font-size:13px;margin-top:4px">הזכרונות שלכם — לסרטון מרגש</div>' +
    '</div>' +
    '<div style="padding:32px 28px;text-align:right">' +
     '<h1 style="margin:0 0 6px;color:#3B2A20;font-size:24px">תודה, ' + d.to_name + '! 🎉</h1>' +
     '<p style="margin:0 0 22px;color:#6E5240;font-size:15px;line-height:1.7">ההזמנה התקבלה ואנחנו כבר מתחילים לעבוד על הסרטון.</p>' +
     '<div style="background:#fff;border:1px solid #F0D9C4;border-radius:12px;padding:8px 20px;margin-bottom:22px">' +
      row('חבילה', d.package_name) +
      row('מחיר', '₪' + d.package_price) +
      row('תמונות', d.photo_count) +
      row('תאריך', d.order_date, true) +
     '</div>' +
     '<div style="background:#FBE4D7;border-radius:12px;padding:16px 20px;margin-bottom:22px">' +
      '<div style="font-weight:800;color:#A83E20;font-size:15px;margin-bottom:8px">מה עכשיו?</div>' +
      '<div style="color:#6E5240;font-size:14px;line-height:1.9">' +
       '⏳ אנחנו יוצרים את הסרטון שלכם — זה לוקח עד <b>48 שעות</b><br>' +
       '📩 כשהוא מוכן, תקבלו מייל עם קישור לצפייה והורדה<br>' +
       '📞 יש שאלה? פשוט השיבו למייל הזה' +
      '</div>' +
     '</div>' +
     '<div style="text-align:center;margin-bottom:22px">' +
      '<a href="' + SITE_URL + '" style="display:inline-block;background:#C4502E;color:#fff;text-decoration:none;font-weight:800;font-size:15px;padding:13px 34px;border-radius:999px">לאתר שלנו ולהזמנה נוספת ←</a>' +
      '<div style="color:#9A8979;font-size:12px;margin-top:8px;direction:ltr">' + SITE_URL + '</div>' +
     '</div>' +
     '<p style="margin:0;color:#9A8979;font-size:13px;text-align:center">נשלח באהבה מזכרונימציה ❤️</p>' +
    '</div>' +
   '</div>' +
  '</div>';

  MailApp.sendEmail({
    to: d.to_email,
    subject: 'ההזמנה שלכם התקבלה — הסרטון בדרך 🎬',
    htmlBody: html
  });

  // ---------- התראה אליכם ----------
  MailApp.sendEmail({
    to: Session.getEffectiveUser().getEmail(),
    subject: '🎬 הזמנה חדשה! ' + d.to_name + ' · ' + d.phone,
    body: 'חבילה: ' + d.package_name + ' (₪' + d.package_price + ')\n' +
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
