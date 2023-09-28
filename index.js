'use strict'

const express = require('express')
const env = require('env-var')
const {
  generateThingDescription
} = require('./lib/thing_description_template')
const { updateThing } = require('./lib/thing_registry')

const Port = env.get('PORT').default('3000').required(true).asPortNumber()
const app = express()

app.use(express.json())

app.post('/', async (req, res) => {
  const thingModelUrl = req.body['thing-model']
  const deviceId = req.headers['x-device-id']
  const tenantName = req.headers['x-tenant-name']
  const credentials = req.headers['x-credentials']
  const credentialsType = req.headers['x-credentials-type']
  // const tenantId = req.headers['x-tenant-id']

  if (
    thingModelUrl === undefined ||
    deviceId === undefined ||
    tenantName === undefined ||
    credentials === undefined ||
    credentialsType === undefined
  ) {
    return res.status(400).statusMessage('Bad Request')
  }

  try {
    const thingDescription = await generateThingDescription({
      deviceId,
      thingModelUrl,
      tenantName,
      credentials,
      credentialsType
    })
    await updateThing(tenantName, thingDescription)
    res.send('OK')
  } catch (e) {
    return res.status(500).send('Internal Server Error')
  }
})

app.listen(Port, () => {
  console.log(`Listening on port ${Port}`)
})
