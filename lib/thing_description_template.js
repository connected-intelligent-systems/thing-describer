'use strict'

const env = require('env-var')

const ThingsBoardHttpEndpoint = env
  .get('THINGSBOARD_HTTP_ENDPOINT')
  .default('http://thingsboard.192-168-178-60.nip.io')
  .required(true)
  .asString()
const ThingsBoardMqttEndpoint = env
  .get('THINGSBOARD_MQTT_ENDPOINT')
  .default('mqtt://192-168-178-60.nip.io:1883')
  .required(true)
  .asString()
const ThingsboardHistoryEndpoint = env
  .get('THINGSBOARD_HISTORY_ENDPOINT')
  .default('http://history.dev')
  .required(true)
  .asString()

const { ThingModelHelpers } = require('@node-wot/td-tools')

const thingModelHelpers = new ThingModelHelpers()

function generateSecurityDefinitions () {
  return {
    basic_sc: {
      scheme: 'basic'
    },
    nosec_sc: { scheme: 'nosec' }
  }
}

function generateHistoryEndpoint (name, type, credentials) {
  return {
    uriVariables: {
      keys: {
        type: 'string',
        const: name
      },
      useStrictDataTypes: {
        type: 'string',
        const: true
      },
      startTs: {
        type: 'integer'
      },
      endTs: {
        type: 'integer'
      }
    },
    output: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          value: {
            type
          },
          ts: {
            type: 'integer'
          }
        }
      }
    },
    forms: [
      {
        href: `${ThingsboardHistoryEndpoint}/${credentials}`
      }
    ]
  }
}

function fixThingModelLink (thingDescription, thingModelUrl) {
  const link = thingDescription.links.find(
    (link) => link.type === 'application/tm+json'
  )
  if (link !== undefined) {
    link.href = thingModelUrl
  }
}

async function generateThingDescription ({
  deviceId,
  thingModelUrl,
  credentials
}) {
  const thingModel = await thingModelHelpers.fetchModel(thingModelUrl)
  const [thingDescription] = await thingModelHelpers.getPartialTDs(thingModel)

  // the node-wot generator seems to generate wrong links to the model
  fixThingModelLink(thingDescription, thingModelUrl)

  thingDescription.id = `uri:uuid:${deviceId}`
  thingDescription.securityDefinitions = generateSecurityDefinitions()
  thingDescription.security = 'basic_sc'

  generateProperties(credentials, thingDescription)
  // todo: generate rpcs and stuff

  return thingDescription
}

function generateProperties (credentials, thingDescription) {
  Object.keys(thingDescription.properties).forEach((name) => {
    thingDescription.properties[name].forms = [
      {
        href: `${ThingsBoardHttpEndpoint}/api/v1/${credentials}/telemetry`,
        op: ['writeproperty'],
        'htv:methodName': 'POST'
      },
      {
        href: `${ThingsBoardMqttEndpoint}/v1/devices/me/telemetry`,
        op: ['writeproperty'],
        security: 'basic_sc'
      }
    ]

    // generate a history endpoint
    const [selectedProperty] = Object.keys(
      thingDescription.properties[name].properties
    ).filter((key) => key !== 'ts')
    if (selectedProperty !== undefined) {
      if (thingDescription.actions === undefined) {
        thingDescription.actions = {}
      }
      thingDescription.actions[name] = generateHistoryEndpoint(
        name,
        thingDescription.properties[name].properties[selectedProperty].type,
        credentials
      )
    }
  })
}

exports = module.exports = {
  generateThingDescription
}
