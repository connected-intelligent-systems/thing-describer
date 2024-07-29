'use strict'

const env = require('env-var')
const { Kafka } = require('kafkajs')
const {
  generateThingDescription
} = require('./lib/thing_description_template')
const {
  createThing,
  updateThing,
  deleteThing,
  getThing,
  assignThing
} = require('./lib/thing_registry')
const { sendSyncStatus } = require('./lib/thingsboard')

const KafkaClientId = env.get('KAFKA_CLIENT_ID').required().asString()
const KafkaBrokers = env.get('KAFKA_BROKERS').required().asArray()
const KafkaGroupId = env.get('KAFKA_GROUP_ID').required().asString()
const KafkaTopic = env.get('KAFKA_TOPIC').required().asString()

/**
 * Decodes Kafka headers.
 *
 * @param {Object} headers - The Kafka headers to decode.
 * @returns {Object} - The decoded headers.
 */
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
    brokers: KafkaBrokers
  })

  const admin = kafka.admin()
  await admin.connect()
  await admin.createTopics({
    topics: [{ topic: KafkaTopic }]
  })

  const consumer = kafka.consumer({ groupId: KafkaGroupId })
  await consumer.connect()
  await consumer.subscribe({ topic: KafkaTopic, fromBeginning: true })

  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const body = JSON.parse(message.value.toString())
        const thingModelUrl =
          body['ss_thing-model'] ||
          body['shared_thing-model'] ||
          body['cs_thing-model'] ||
          body['thing-model']
        const thingMetadata =
          body['ss_thing-metadata'] ||
          body['shared_thing-metadata'] ||
          body['cs_thing-metadata'] ||
          body['thing-metadata'] ||
          {}
        const headers = decodeHeaders(message.headers)
        const deviceId = headers.tb_msg_md_originatorId
        const tenantId = headers.tb_msg_md_tenant_id
        const credentials = headers.tb_msg_md_credentials
        const credentialsType = headers.tb_msg_md_credentialsType
        const messageType = headers.tb_msg_md_messageType
        const customerId = headers.tb_msg_md_customer_id

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
            tenantId === undefined ||
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

          const thing = await getThing(tenantId, thingDescription.id)
          if (thing) {
            await updateThing(tenantId, thingDescription)
          } else {
            await createThing(tenantId, customerId, thingDescription)
          }

          await assignThing(thingDescription.id, tenantId, customerId)
        } else if (messageType === 'ATTRIBUTES_DELETED') {
          // if thing-model attribute was deleted, delete thing from registry
          if (deviceId === undefined || tenantId === undefined) {
            console.warn(
              'missing property to delete thing description. ignoring message: ',
              message.value.toString()
            )
            return
          }

          await deleteThing(tenantId, `uri:uuid:${deviceId}`)
        } else if (messageType === 'ENTITY_DELETED') {
          // if device was deleted, delete thing from registry
          if (tenantId === undefined) {
            console.warn(
              'missing property to delete thing description. ignoring message: ',
              message.value.toString()
            )
            return
          }

          if (body.id.entityType === 'DEVICE') {
            await deleteThing(tenantId, `uri:uuid:${body.id.id}`)
          }
        }

        console.log('Successfully processed message', message.value.toString())
        if (credentials) {
          await sendSyncStatus(
            credentials,
            'SUCCESS',
            'Successfully synced device'
          )
        }
      } catch (e) {
        console.error('Error while processing message. Ignoring.', message, e)
        const headers = decodeHeaders(message.headers)
        const credentials = headers.tb_msg_md_credentials
        if (credentials) {
          await sendSyncStatus(credentials, 'ERROR', e.message)
        }
      }
    }
  })
}

run()
  .then(() => console.log('kafka running'))
  .catch((e) => console.error(e))
