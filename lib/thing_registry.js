'use strict'

const env = require('env-var')

const ThingRegistryUrl = env
  .get('THING_REGISTRY_URL')
  .default('http://thing-registry-dev.192-168-178-60.nip.io/registry')
  .required()
  .asString()

async function createThing (tenantId, customerId, thingDescription) {
  const response = await fetch(`${ThingRegistryUrl}/${tenantId}/things`, {
    method: 'POST',
    body: JSON.stringify(thingDescription),
    headers: {
      'Content-Type': 'application/json',
      'x-customer-id': customerId
    }
  })

  return response
}

async function deleteThing (tenantId, thingId) {
  return fetch(`${ThingRegistryUrl}/${tenantId}/things/${thingId}`, {
    method: 'DELETE'
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
