'use strict'

const env = require('env-var')
const { Kafka } = require('kafkajs')
const {
  generateThingDescription
} = require('./lib/thing_description_template')
const { updateThing, deleteThing } = require('./lib/thing_registry')

const KafkaClientId = env.get('KAFKA_CLIENT_ID').required().asString()
const KafkaBrokers = env.get('KAFKA_BROKERS').required().asArray()
const KafkaGroupId = env.get('KAFKA_GROUP_ID').required().asString()
const KafkaTopic = env.get('KAFKA_TOPIC').required().asString()

function decodeHeaders (headers) {
  const decodedHeaders = {}
  for (const key in headers) {
    const valueBuffer = headers[key]
    decodedHeaders[key] = valueBuffer ? valueBuffer.toString() : null
  }
  return decodedHeaders
}

async function run () {
  const kafka = new Kafka({
    clientId: KafkaClientId,
    brokers: KafkaBrokers,
    sasl: {
      mechanism: 'plain'
    }
  })

  const consumer = kafka.consumer({ groupId: KafkaGroupId })

  await consumer.connect()
  await consumer.subscribe({ topic: KafkaTopic, fromBeginning: true })

  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const body = JSON.parse(message.value.toString())
        const thingModelUrl =
          body['cs_thing-model'] ||
          body['ss_thing-model'] ||
          body['shared_thing-model']
        const thingMetadata =
          body['cs_thing-metadata'] ||
          body['ss_thing-metadata'] ||
          body['shared_thing-metadata'] ||
          {}
        const headers = decodeHeaders(message.headers)
        const deviceId = headers.tb_msg_md_originatorId
        const tenantName = headers.tb_msg_md_tenant_title
        const credentials = headers.tb_msg_md_credentials
        const credentialsType = headers.tb_msg_md_credentialsType
        const messageType = headers.tb_msg_md_messageType
        const customerTitle = headers.tb_msg_md_customer_title || undefined

        if (messageType === undefined) {
          console.warn(
            'missing message type. ignoring message: ',
            message.value.toString()
          )
          return
        }

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
            console.warn(
              'missing property to generate thing description. ignoring message: ',
              message.value.toString()
            )
            return
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
            console.warn(
              'missing property to delete thing description. ignoring message: ',
              message.value.toString()
            )
            return
          }

          await deleteThing(tenantName, `uri:uuid:${deviceId}`)
        } else if (messageType === 'ENTITY_DELETED') {
          // if device was deleted, delete thing from registry
          if (tenantName === undefined) {
            console.warn(
              'missing property to delete thing description. ignoring message: ',
              message.value.toString()
            )
            return
          }

          if (body.id.entityType === 'DEVICE') {
            await deleteThing(tenantName, `uri:uuid:${body.id.id}`)
          }
        }
        console.log('Successfully processed message', message.value.toString())
      } catch (e) {
        console.error('Error while processing message. Ignoring.', message, e)
      }
    }
  })
}

run()
  .then(() => console.log('kafka running'))
  .catch((e) => console.error(e))
