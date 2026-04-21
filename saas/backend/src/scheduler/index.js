const cron = require('node-cron');
const { sendReminders } = require('./reminderJob');
const { expireAndRenotify } = require('../services/waitlistService');

function startScheduler() {
  // Reminders every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      await sendReminders();
    } catch (err) {
      console.error('Reminder job error:', err.message);
    }
  });

  // Waitlist expiry every 2 minutes
  cron.schedule('*/2 * * * *', async () => {
    try {
      await expireAndRenotify();
    } catch (err) {
      console.error('Waitlist expiry job error:', err.message);
    }
  });

  console.log('Scheduler started.');
}

module.exports = { startScheduler };
