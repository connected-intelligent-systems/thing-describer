# Thing Describer

The Thing Describer streamlines the creation of Thing Descriptions in the Thing Registry for devices on the ThingsBoard platform using standardized Thing Models. This allows developers to efficiently produce detailed and accurate descriptions of their devices, saving time and effort. These descriptions provide a comprehensive overview of the device's capabilities and operations, enhancing compatibility with other applications and services.

## Generating Thing Descriptions

To generate a Thing Description, you must employ specific attributes applicable to client, server, or a hybrid of both within ThingsBoard. The essential attributes to utilize include:

* `thing-model`: This attribute serves as a reference link to a [W3C Thing Model](https://www.w3.org/TR/wot-thing-description11/). It ensures that the description adheres to a standardized format, enhancing device compatibility across different platforms and services.
* `thing-metadata`: This attribute allows for the inclusion of additional metadata such as the device’s description, title, and other relevant information that aids in the comprehensive documentation of the IoT device. Metadata enriches the Thing Description, providing users and services with more context about the device's capabilities and features.

## How to run this image

```shell
docker run -it --rm --name thing-describer \
-e THINGSBOARD_HTTP_ENDPOINT='http://thingsboard' \
-e THINGSBOARD_MQTT_ENDPOINT='mqtt://thingsboard:1883' \
-e THINGSBOARD_HISTORY_ENDPOINT='http://thingsboard/api/history' \
-e THING_REGISTRY_URL='http://thing-registry:8080' \
-e KAFKA_CLIENT_ID='thing-describer' \
-e KAFKA_BROKERS='kafka-headless:9092' \
-e KAFKA_GROUP_ID='thing-describer-group-1' \
-e KAFKA_TOPIC='thing-describer' \
registry.fsn.iotx.materna.work/registry/public/thing-describer:latest
``` 

## Environment Variables

The following environment variables can be used to configure the Thing Describer:

- `THINGSBOARD_HTTP_ENDPOINT`: This represents the HTTP endpoint used for retrieving data from devices. It allows for direct web-based access to current device statuses and metrics.
- `THINGSBOARD_MQTT_ENDPOINT`: This MQTT endpoint facilitates the fetching of device data using the MQTT protocol, enabling real-time data communication and device management through a lightweight messaging system.
- `THINGSBOARD_HISTORY_ENDPOINT`: This endpoint is specifically designed for accessing historical data. It provides a means to query and retrieve past records and metrics of device activities.
- `THING_REGISTRY_URL`: The URL for the thing registry service, where new device descriptions are registered and stored. This is essential for adding devices to the network and ensuring their details are accurately documented for management and integration purposes.
- `KAFKA_CLIENT_ID`: The client ID used to identify the Kafka client when connecting to the Kafka brokers.
- `KAFKA_BROKERS`: The list of Kafka brokers to connect to.
- `KAFKA_GROUP_ID`: The ID of the consumer group that the Kafka client belongs to.
- `KAFKA_TOPIC`: The topic to consume or produce messages from/to in Kafka.

These environment variables allow you to customize the behavior of the Thing Describer according to your specific needs.

## Authors 

Sebastian Alberternst <sebastian.alberternst@dfki.de>

## License

MIT 

