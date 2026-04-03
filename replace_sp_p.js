const fs = require('fs');
const path = require('path');

const files = [
  'sql_queries/refactored_logic.sql',
  'sql_queries/database_logic.sql',
  'backend/src/utils/dbHelpers.js',
  'backend/src/services/adminService.js',
  'backend/src/services/agentService.js',
  'backend/src/services/fraudDetectionService.js',
  'backend/src/services/loanService.js',
  'backend/src/services/notificationService.js',
  'backend/src/services/paymentMethodService.js',
  'backend/src/services/savingsService.js',
  'backend/src/services/transactionService.js'
];

const basePath = 'c:\\clickpay refactored\\ClickPay';

files.forEach(file => {
  const filePath = path.join(basePath, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const newContent = content.replace(/\bsp_/g, 'p_');
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`Updated ${file}`);
    }
  }
});
