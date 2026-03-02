const fs = require('fs');
const path = require('path');

const STORAGE_STATE_FILE = 'storageState.json';

function getStorageStatePath() {
  return path.join(__dirname, '..', STORAGE_STATE_FILE);
}

function hasStorageState() {
  const storagePath = getStorageStatePath();
  try {
    return fs.existsSync(storagePath);
  } catch (e) {
    return false;
  }
}

async function saveStorageState(context) {
  const storagePath = getStorageStatePath();
  await context.storageState({ path: storagePath });
  return storagePath;
}

module.exports = {
  STORAGE_STATE_FILE,
  getStorageStatePath,
  hasStorageState,
  saveStorageState
};
