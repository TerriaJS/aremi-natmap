#!/bin/bash
#
# Use this script to publish a catalogue init file to the static web bucket.
#

if [ "$1" = "" ]
then
    echo "Specify the version of the init file as the only argument."
    echo "The file will be published to:"
    echo "   s3://static.aremi.data61.io/init/aremi-<version>.json"
    exit 1
fi

SOURCE_FILE=wwwroot/init/aremi.json
TARGET_VERSION=$1

# Publish the catalog to an S3 bucket on AWS.
gzip --keep ${SOURCE_FILE}
aws s3 --profile aremi \
  cp --content-encoding gzip --content-type "application/json" \
  ${SOURCE_FILE}.gz \
  s3://static.aremi.data61.io/init/aremi-${TARGET_VERSION}.json

rm ${SOURCE_FILE}.gz
