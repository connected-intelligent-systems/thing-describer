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

function generateSecurityDefinitions () {
  return {
    basic_sc: {
      scheme: 'basic'
    },
    nosec_sc: { scheme: 'nosec' }
  }
}

function generateHistoryEndpoint (id, name, type, credentials) {
  return {
    '@id': `${id}?actions/${name}`,
    'iot:records': `${id}?properties/${name}`,
    uriVariables: {
      from: {
        type: 'integer'
      },
      to: {
        type: 'integer'
      }
    },
    output: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          [name]: {
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
        href: `${ThingsboardHistoryEndpoint}/${credentials}/${name}`,
        'htv:methodName': 'GET'
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
  credentials,
  thingMetadata
}) {
  const thingModelHelpers = new ThingModelHelpers()
  const thingModel = await thingModelHelpers.fetchModel(thingModelUrl)
  const [thingDescription] = await thingModelHelpers.getPartialTDs(thingModel)

  // the node-wot generator seems to generate wrong links to the model
  fixThingModelLink(thingDescription, thingModelUrl)

  thingDescription.id = `uri:uuid:${deviceId}`
  thingDescription.securityDefinitions = generateSecurityDefinitions()
  thingDescription.security = 'basic_sc'

  if (thingMetadata.parent) {
    thingDescription.links.push({
      rel: 'collection',
      href: `uri:uuid:${thingMetadata.parent}`,
      type: ' application/td+json'
    })
  }

  if (thingMetadata.icon) {
    thingDescription.links.push({
      rel: 'icon',
      href: thingMetadata.icon
    })
  }

  if (thingMetadata.description) {
    thingDescription.description = thingMetadata.description
  }

  if (thingMetadata.title) {
    thingDescription.title = thingMetadata.title
  }

  if (thingMetadata.category) {
    thingDescription.category = thingMetadata.category
  }

  if (thingMetadata.manufacturer) {
    thingDescription.manufacturer = thingMetadata.manufacturer
  }

  generateProperties(credentials, thingDescription, thingMetadata)
  generateTopLevelForms(credentials, thingDescription, thingMetadata)
  // todo: generate rpcs and stuff

  return thingDescription
}

function generateProperties (credentials, thingDescription, thingMetadata) {
  Object.keys(thingDescription.properties).forEach((name) => {
    if (thingMetadata[name]) {
      thingDescription.properties[name].unit = thingMetadata[name].unit
    }

    // link property to generated history endpoint
    thingDescription.properties[name]['@id'] = `${thingDescription.id}?properties/${name}`
    thingDescription.properties[name]['iot:recordedBy'] = {
      '@id': `${thingDescription.id}?actions/${name}`
    }

    // add form endpoints
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
      },
      {
        op: ['readproperty'],
        href: `${ThingsboardHistoryEndpoint}/${credentials}/${name}/latest`
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
        thingDescription.id,
        name,
        thingDescription.properties[name].properties[selectedProperty].type,
        credentials
      )
    }
  })
}

function generateTopLevelForms (credentials, thingDescription, thingMetadata) {
  thingDescription.forms = [
    {
      op: 'readallproperties',
      href: `${ThingsboardHistoryEndpoint}/${credentials}/latest`,
      contentType: 'application/json',
      'htv:methodName': 'GET'
    }
  ]
}

exports = module.exports = {
  generateThingDescription
}
