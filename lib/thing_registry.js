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
      'x-tenant-id': tenantId,
      'x-auth-request-roles': customerId ? 'role:customer' : 'role:admin'
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
 * @param {string} thingId - Id of the thing to delete
 */
async function deleteThing (tenantId, thingId) {
  const response = await fetch(`${ThingRegistryUrl}/things/${thingId}`, {
    method: 'DELETE',
    headers: {
      'x-tenant-id': tenantId,
      'x-auth-request-roles': 'role:admin'
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
 * @param {object} thingDescription - A valid thing description
 */
async function updateThing (tenantId, thingDescription) {
  const response = await fetch(
    `${ThingRegistryUrl}/things/${thingDescription.id}`,
    {
      method: 'PUT',
      body: JSON.stringify(thingDescription),
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': tenantId,
        'x-auth-request-roles': 'role:admin'
      }
    }
  )

  if (!response.ok) {
    console.warn(
      `Error ${response.status} updating thing: ${response.statusText}`
    )
  }

  return response
}

/**
 * Retrieves a thing from the Thing Registry.
 *
 * @param {string} tenantId - The ID of the tenant.
 * @param {string} thingId - The ID of the thing to retrieve.
 * @returns {Promise<object|null>} - A Promise that resolves to the retrieved thing object, or null if an error occurred.
 */
async function getThing (tenantId, thingId) {
  const response = await fetch(`${ThingRegistryUrl}/things/${thingId}`, {
    headers: {
      'x-tenant-id': tenantId,
      'x-auth-request-roles': 'role:admin'
    }
  })

  if (!response.ok) {
    console.warn(
      `Error ${response.status} getting thing: ${response.statusText}`
    )

    return null
  }

  return response.json()
}

/**
 * Assigns a thing to a customer.
 *
 * @param {string} thingId - The ID of the thing to assign.
 * @param {string} tenantId - The ID of the tenant.
 * @param {string} customerId - The ID of the customer.
 * @returns {Promise<Response>} - A promise that resolves to the response from the server.
 */
async function assignThing (thingId, tenantId, customerId) {
  const response = await fetch(`${ThingRegistryUrl}/things/${thingId}/assign`, {
    method: 'POST',
    body: JSON.stringify({ customerId: customerId || null }),
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': tenantId,
      'x-auth-request-roles': 'role:admin'
    }
  })

  if (!response.ok) {
    console.warn(
      `Error ${response.status} assigning thing: ${response.statusText}`
    )
  }

  return response
}

exports = module.exports = {
  createThing,
  deleteThing,
  updateThing,
  getThing,
  assignThing
}
