import * as crypto from 'crypto'
import * as AWS from 'aws-sdk'
import * as lambda from 'aws-lambda'

const BUCKET_NAME = process.env.TRANSCRIBE_BUCKET as string
const AWS_REGION = process.env.AWS_REGION as string
const SECRET_NAME = process.env.SECRET_NAME as string

const secret = new AWS.SecretsManager({ region: AWS_REGION })

const hmac = (key: string | Buffer, value: string) => {
  return crypto.createHmac('sha256', key).update(value).digest()
}

const responseError = (err: Error) => {
  return {
    statusCode: err.statusCode || 500,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': '*'
    },
    body: JSON.stringify({ error: err.message })
  }
}

exports.handler = async (
  event: lambda.APIGatewayEvent,
  context: lambda.Context
) => {
  const canonicalReq = event.queryStringParameters?.['canonical_request'] || ''
  const toSign = event.queryStringParameters?.['to_sign'] || ''

  // check request
  const [method, path, body] = canonicalReq.split(/\n/)
  const host = /(host:[^\n]+)/.test(canonicalReq) && RegExp.$1

  if (
    ['POST', 'PUT'].includes(method) === false ||
    /^\/[a-z0-9\-]+$/.test(path) === false ||
    /^(uploads|partNumber|uploadId)=/.test(body) === false ||
    host !== `host:${BUCKET_NAME}.s3-${AWS_REGION}.amazonaws.com`
  ) {
    console.log({ method, path, body, host })

    const err = new Error('Invalid request')
    err.statusCode = 400
    return responseError(err)
  }

  // check digest
  const canonicalReqHash = crypto
    .createHash('sha256')
    .update(canonicalReq, 'utf8')
    .digest('hex')
  const signHash = toSign.split(/\n/).pop()

  if (signHash !== canonicalReqHash) {
    console.log({ canonicalReqHash, signHash })

    const err = new Error('Hash not matching')
    err.statusCode = 400
    return responseError(err)
  }

  const secretData = await secret
    .getSecretValue({ SecretId: SECRET_NAME })
    .promise()
  const secretKey = secretData.SecretString

  const timestamp = (event.queryStringParameters?.datetime || '').substr(0, 8)

  const dateKey = hmac('AWS4' + secretKey, timestamp)
  const dateRegionKey = hmac(dateKey, AWS_REGION)
  const dateRegionServiceKey = hmac(dateRegionKey, 's3')
  const signingKey = hmac(dateRegionServiceKey, 'aws4_request')

  const signature = hmac(signingKey, toSign).toString('hex')
  console.log(`Created signature "${signature}" from ${toSign}`)

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': '*'
    },
    body: signature
  }
}
