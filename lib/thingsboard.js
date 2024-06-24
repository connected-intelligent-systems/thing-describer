'use strict'

const env = require('env-var')

/**
 * The URL for the Thingsboard HTTP Device API.
 * @type {string}
 */
const ThingsboardHttpDeviceApiUrl = env
  .get('THINGSBOARD_HTTP_DEVICE_API_URL')
  .required()
  .asString()

/**
 * Sends the sync status of a thing to the Thingsboard server.
 * @param {string} token - The token of the thing.
 * @param {string} status - The sync status of the thing.
 * @param {string} message - The message associated with the sync status.
 * @returns {Promise<Response>} - A promise that resolves to the response from the server.
 */
async function sendSyncStatus (token, status, message) {
  const response = await fetch(
    `${ThingsboardHttpDeviceApiUrl}/${token}/attributes`,
    {
      method: 'POST',
      body: JSON.stringify({
        'thing-registry-sync-status': {
          ts: Date.now(),
          status,
          message
        }
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    }
  )

  if (!response.ok) {
    console.warn(
      `Error ${response.status} sending sync status: ${response.statusText}`
    )
  }

  return response
}

exports = module.exports = {
  sendSyncStatus
}
