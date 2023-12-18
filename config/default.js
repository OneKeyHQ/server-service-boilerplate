const path = require('path');
const dotenv = require('dotenv');

dotenv.config({
  path: path.resolve(__dirname, '..', '.env'),
});

module.exports = {
  translations: {
    dist: './src/locales/',
    token: process.env.LOKALISE_TOKEN,
    projects: [
      {
        id: process.env.LOKALISE_PROJECT_ID,
        all_platforms: true,
      },
    ],
  },
};
