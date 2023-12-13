'use strict'

const env = require('env-var')

const ThingRegistryUrl = env.get('THING_REGISTRY_URL').required().asString()

/**
 * Creates a thing description in the thing registry
 *
 * @param {string} tenantId - Id of the tenant
 * @param {string} customerId - Id of the customer
 * @param {object} thingDescription - A valid thing description
 */
async function createThing (tenantId, customerId, thingDescription) {
  const response = await fetch(`${ThingRegistryUrl}/things`, {
    method: 'POST',
    body: JSON.stringify(thingDescription),
    headers: {
      'Content-Type': 'application/json',
      ...(customerId ? { 'x-customer-id': customerId } : {}),
      'x-tenant-id': tenantId
    }
  })

  if (!response.ok) {
    console.warn(
      `Error ${response.status} creating thing: ${response.statusText}`
    )
  }

  return response
}

/**
 * Deletes a thing description in the thing registry
 *
 * @param {string} tenantId - Id of the tenant
 * @param {string} customerId - Id of the customer
 * @param {string} thingId - Id of the thing to delete
 */
async function deleteThing (tenantId, customerId, thingId) {
  const response = await fetch(`${ThingRegistryUrl}/things/${thingId}`, {
    method: 'DELETE',
    headers: {
      'x-tenant-id': tenantId,
      ...(customerId ? { 'x-customer-id': customerId } : {}),
    }
  })

  if (!response.ok) {
    console.warn(
      `Error ${response.status} deleting thing: ${response.statusText}`
    )
  }

  return response
}

/**
 * Updates a thing description in the thing registry
 *
 * @param {string} tenantId - Id of the tenant
 * @param {string} customerId - Id of the customer
 * @param {object} thingDescription - A valid thing description
 */
async function updateThing (tenantId, customerId, thingDescription) {
  await deleteThing(tenantId, customerId, thingDescription.id)
  await createThing(tenantId, customerId, thingDescription)
}

exports = module.exports = {
  updateThing,
  deleteThing
}
