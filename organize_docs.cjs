const fs = require('fs');
const path = require('path');

const docsDir = path.join(process.cwd(), 'private_assets/xDocumentation/RestoredDocumentation');

const categories = {
  'Legacy_Khushraazi': [
    'PHYSIO', 'ROOM-AVAILABILITY', 'VITALS', 'FACILITY-MANAGEMENT', 'INFRA-FLATS',
    'OCCUPANCY-UX', 'REPORT-DUPLICATE-OCCUPANCY', 'REPORT-EVENT-OCCUPANCY', 'ROOMS-INFRA',
    'DATA-SETUP-PHYSIO', 'DATA-SETUP-ROOM-AVAILABILITY', 'DATA-SETUP-VITALS'
  ],
  'AIAC': ['AIAC'],
  'Auth': ['AUTH', 'SESSION-EXPIRY', 'SESSION-HANDOVER'],
  'BI_and_Reports': ['BI-', 'CUSTOM-REPORT', 'REPORT-PDF', 'REPORTS'],
  'Core_Architecture': ['ARCHITECTURAL', 'CORE-DECOUPLING', 'DATA-ARCH', 'PERF', 'API-', 'AUTO-SYNC', 'IDEMPOTENCY', 'PK-', 'PRIMARY-KEY', 'DATA-DICTIONARY'],
  'Dashboard_UI': ['DASHBOARD', 'UI-', 'MOBILE-NAV', 'TABBED-NAV', 'DARK-MODE', 'THEMING', 'ACCORDION', 'PAGINATION', 'SEARCH'],
  'Forms_Layout': ['FORM-LAYOUT', 'WYSIWYG'],
  'Inventory': ['INVENTORY'],
  'Notifications_Telegram': ['NOTIFICATIONS', 'MULTI-BOT', 'TELEGRAM', 'Notification-Template'],
  'People_Users': ['PEOPLE', 'USERS', 'MY-PROFILE', 'USER-CONTACT', 'AUTO-PARTNER', 'VOUCHING', 'ACCOUNT-SUBMISSIONS', 'ACTIVE-STATUS', 'USERID-FIELD'],
  'Permissions': ['PERMISSION', 'DEFAULT-PERMS'],
  'SMR': ['SMR', 'DECOUPLE-SMR'],
  'Settings_Config': ['SETTINGS', 'APP-CONFIG', 'RATE-LIMIT', 'MAINTENANCE-TOOLS', 'MASTERS-MANAGEMENT'],
  'General_QA_Logs': ['BUG-LOG', 'Chat-History', 'DEBUGGING', 'LONG-TERM', 'QA-RECORD-V', 'SETUP', 'MANUAL-CLEANUP', 'END-USER-GUIDE', 'PHASE1', 'MANDATORY-VALIDATION', '1-Sample']
};

if (!fs.existsSync(docsDir)) {
  console.error('Directory not found:', docsDir);
  process.exit(1);
}

const files = fs.readdirSync(docsDir);

files.forEach(file => {
  const filePath = path.join(docsDir, file);
  if (fs.statSync(filePath).isDirectory()) return;

  let moved = false;
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(kw => file.toUpperCase().includes(kw.toUpperCase()))) {
      const targetDir = path.join(docsDir, category);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      fs.renameSync(filePath, path.join(targetDir, file));
      moved = true;
      console.log(`Moved ${file} to ${category}`);
      break;
    }
  }

  if (!moved) {
    const targetDir = path.join(docsDir, 'Uncategorized');
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    fs.renameSync(filePath, path.join(targetDir, file));
    console.log(`Moved ${file} to Uncategorized`);
  }
});

console.log('Done organizing.');
