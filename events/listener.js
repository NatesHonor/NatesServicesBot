const fs = require('fs');
const path = require('path');

async function listener(client) {

  const eventsPath = __dirname;

  console.log('========== EVENT LOADER START ==========');
  console.log('Events base path:', eventsPath);

  function loadEvents(dir) {
    console.log('Reading directory:', dir);

    const files = fs.readdirSync(dir);
    console.log('Files found:', files);

    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        console.log('Entering subdirectory:', fullPath);
        loadEvents(fullPath);
      } 
      else if (file.endsWith('.js') && file !== 'listener.js') {

        console.log('Found JS file:', fullPath);

        try {
          const eventFile = require(fullPath);
          console.log('Loaded file:', fullPath);

          if (typeof eventFile.listener === 'function') {
            console.log('Registering listener from:', fullPath);
            eventFile.listener(client);
          } else {
            console.log('No listener function exported in:', fullPath);
          }

        } catch (err) {
          console.error('Error loading file:', fullPath);
          console.error(err);
        }
      }
    }
  }

  loadEvents(eventsPath);

  console.log('========== EVENT LOADER END ==========');
}

module.exports = { listener };