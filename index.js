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

/**
 * Health endpoint to indicate if the service is up and running
 *
 * @param {express.Request} req
 * @param {express.Response} res
 */
app.get('/', (req, res) => {
  res.send('OK')
})

/**
 * This endpoint is called from the thingsboard rule engine and contains several metadata to create or delete
 * a valid Thing Description in the thing registry. Endpoints are automatically added to
 * properties as well as Thing History actions.
 *
 * @param {express.Request} req
 * @param {express.Response} res
 */
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
      // if the devices attributes where updated or the entity was assigned/unassigned update the thing description
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
        credentials,
        thingMetadata
      })

      await updateThing(tenantName, customerTitle, thingDescription)
    } else if (messageType === 'ATTRIBUTES_DELETED') {
      // if thing-model attribute was deleted, delete thing from registry
      if (deviceId === undefined || tenantName === undefined) {
        return res.status(400).send('Bad Request')
      }

      await deleteThing(tenantName, `uri:uuid:${deviceId}`)
    } else if (messageType === 'ENTITY_DELETED') {
      // if device was deleted, delete thing from registry
      if (tenantName === undefined) {
        return res.status(400).send('Bad Request')
      }

      if (req.body.id.entityType === 'DEVICE') {
        await deleteThing(tenantName, `uri:uuid:${req.body.id.id}`)
      }
    }

    return res.send('OK')
  } catch (e) {
    console.error(e)
    return res.status(500).send('Internal Server Error')
  }
})

app.listen(Port, () => {
  console.log(`Listening on port ${Port}`)
})
