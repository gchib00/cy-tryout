require('dotenv').config()
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    watchForFileChanges: false,
    videoUploadOnPasses: false,
    baseUrl: process.env.BASE_URL,
    env: {
      apiBaseUrl: process.env.API_BASE_URL,
      testPaymentAmount: 0.01,
      testEmail: 'chibukhashviligiorgi@gmail.com'
    }
  }
});
