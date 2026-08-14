#!/bin/bash
set -e

if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

echo "Building Java application..."
./mvnw clean package

DEPLOY_BUCKET="vocabkicker-cf-deployments-774411"

aws s3 ls "s3://$DEPLOY_BUCKET" 2>/dev/null || aws s3 mb "s3://$DEPLOY_BUCKET"

echo "Packaging template and uploading code to S3..."
aws cloudformation package \
  --template-file template.yaml \
  --s3-bucket "$DEPLOY_BUCKET" \
  --output-template-file packaged.yaml

echo "Deploying CloudFormation stack..."
aws cloudformation deploy \
  --template-file packaged.yaml \
  --stack-name vocabkicker-serverless \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    JwtSecret="$JWT_SECRET" \
    CorsAllowOrigin="$CORS_ALLOW_ORIGIN" \
    ImportBucketName="$IMPORT_BUCKET_NAME"

echo "Deployment complete!"
