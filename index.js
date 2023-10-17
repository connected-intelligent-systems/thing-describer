'use strict'

const express = require('express')
const env = require('env-var')
const {
  generateThingDescription
} = require('./lib/thing_description_template')
const { updateThing, deleteThing } = require('./lib/thing_registry')

const Port = env.get('PORT').default('3000').required(true).asPortNumber()
const app = express()

app.use(express.json())

app.get('/', (req, res) => {
  res.send('OK')
})

app.post('/', async (req, res) => {
  const thingModelUrl =
    req.body['cs_thing-model'] ||
    req.body['ss_thing-model'] ||
    req.body['shared_thing-model']
  const thingMetadata =
    req.body['cs_thing-metadata'] ||
    req.body['ss_thing-metadata'] ||
    req.body['shared_thing-metadata'] ||
    {}
  const deviceId = req.headers['x-device-id']
  const tenantName = req.headers['x-tenant-name']
  const credentials = req.headers['x-credentials']
  const credentialsType = req.headers['x-credentials-type']
  const messageType = req.headers['x-message-type']
  // const customerId = req.headers['x-customer-id']
  const customerTitle = req.headers['x-customer-title'] || undefined

  if (messageType === undefined) {
    return res.status(400).send('Bad Request')
  }

  try {
    if (
      messageType === 'ATTRIBUTES_UPDATED' ||
      messageType === 'POST_ATTRIBUTES_REQUEST' ||
      messageType === 'ENTITY_ASSIGNED' ||
      messageType === 'ENTITY_UNASSIGNED'
    ) {
      if (
        thingModelUrl === undefined ||
        deviceId === undefined ||
        tenantName === undefined ||
        credentials === undefined ||
        credentialsType === undefined
      ) {
        return res.status(400).send('Bad Request')
      }

      const thingDescription = await generateThingDescription({
        deviceId,
        thingModelUrl,
        tenantName,
        credentials,
        credentialsType,
        thingMetadata
      })

      await updateThing(tenantName, customerTitle, thingDescription)
    } else if (messageType === 'ATTRIBUTES_DELETED') {
      if (deviceId === undefined || tenantName === undefined) {
        return res.status(400).send('Bad Request')
      }

      await deleteThing(tenantName, customerTitle, `uri:uuid:${deviceId}`)
    } else if (messageType === 'ENTITY_DELETED') {
      if (tenantName === undefined) {
        return res.status(400).send('Bad Request')
      }

      if (req.body.id.entityType === 'DEVICE') {
        await deleteThing(tenantName, `uri:uuid:${req.body.id.id}`)
      }
    }

    res.send('OK')
  } catch (e) {
    console.error(e)
    return res.status(500).send('Internal Server Error')
  }
})

app.listen(Port, () => {
  console.log(`Listening on port ${Port}`)
})
