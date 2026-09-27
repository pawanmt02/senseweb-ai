/**
 * SenseWeb AI - Messaging Utility Module
 * 
 * Provides type-safe message passing helpers for communication
 * between extension contexts (popup, sidepanel, content scripts, service worker).
 * 
 * Used by the React popup/sidepanel components.
 * Content scripts and service worker inline their own message logic.
 */

import { MESSAGE_TYPES } from './constants.js';

/**
 * Sends a message to the background service worker.
 * @param {string} type - Message type from MESSAGE_TYPES
 * @param {object} [payload={}] - Data to send
 * @returns {Promise<any>} Response from the service worker
 */
export async function sendToBackground(type, payload = {}) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type, payload }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(response);
    });
  });
}

/**
 * Sends a message to a content script in a specific tab.
 * @param {number} tabId - Target tab ID
 * @param {string} type - Message type from MESSAGE_TYPES
 * @param {object} [payload={}] - Data to send
 * @returns {Promise<any>} Response from the content script
 */
export async function sendToContentScript(tabId, type, payload = {}) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, { type, payload }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(response);
    });
  });
}

/**
 * Gets the active tab in the current window.
 * @returns {Promise<chrome.tabs.Tab|null>}
 */
export async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab || null;
}
