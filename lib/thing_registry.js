'use strict'

const env = require('env-var')

const ThingRegistryUrl = env
  .get('THING_REGISTRY_URL')
  .default('http://thing-registry-dev.192-168-178-60.nip.io/registry')
  .required()
  .asString()

async function createThing (tenantId, thingDescription) {
  const response = await fetch(`${ThingRegistryUrl}/${tenantId}/things`, {
    method: 'POST',
    body: JSON.stringify(thingDescription),
    headers: {
      'Content-Type': 'application/json'
    }
  })

  console.log(response.status, response.statusText, tenantId)

  return response
}

async function setThingCredentials (tenantId, thingId, credentials) {
  // todo: implement
}

async function deleteThing (tenantId, thingId) {
  return fetch(`${ThingRegistryUrl}/${tenantId}/things/${thingId}`, {
    method: 'DELETE'
  })
}

async function updateThing (tenantId, thingDescription) {
  await deleteThing(tenantId, thingDescription.id)
  await createThing(tenantId, thingDescription)
}

exports = module.exports = {
  updateThing
}
