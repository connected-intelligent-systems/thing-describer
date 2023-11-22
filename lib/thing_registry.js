'use strict'

const env = require('env-var')

const ThingRegistryUrl = env.get('THING_REGISTRY_URL').required().asString()

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

  return response
}

async function deleteThing (tenantId, thingId) {
  return fetch(`${ThingRegistryUrl}/things/${thingId}`, {
    method: 'DELETE',
    headers: {
      'x-tenant-id': tenantId
    }
  })
}

async function updateThing (tenantId, customerId, thingDescription) {
  await deleteThing(tenantId, thingDescription.id)
  await createThing(tenantId, customerId, thingDescription)
}

exports = module.exports = {
  updateThing,
  deleteThing
}
