import * as crypto from 'crypto'
import * as AWS from 'aws-sdk'
import * as lambda from 'aws-lambda'
AWS.config.update({ region: process.env.AWS_REGION })

const ddb = new AWS.DynamoDB({ apiVersion: '2012-08-10' })
const s3 = new AWS.S3({ apiVersion: '2006-03-01' })
const trans = new AWS.TranscribeService({ apiVersion: '2017-10-26' })

const TableName = process.env.VOCABULARY_TABLE as string
const BucketName = process.env.TRANSCRIBE_BUCKET as string

exports.handler = async (
  event: lambda.ScheduledEvent,
  context: lambda.Context
) => {
  const scanData = await ddb.scan({ TableName }).promise()

  const data = scanData?.Items?.map((item) => {
    return AWS.DynamoDB.Converter.unmarshall(item)
  }).sort((a, b) => {
    return a.phrase > b.phrase ? 1 : -1
  })

  if (!data) return

  let body = 'Phrase\tIPA\tSoundsLike\tDisplayAs\n'
  body += data
    .map((value) => {
      return `${value.phrase}\t\t\t${value.display}`
    })
    .join('\n')

  const key = `vocabulary/voc-${Date.now()}-${crypto
    .randomBytes(24)
    .toString('hex')}.txt`

  await s3
    .putObject({
      Bucket: BucketName,
      Key: key,
      ContentType: 'text/plain',
      Body: body
    })
    .promise()

  const VocabularyName = 'Transcribe-Proto-Vocabularies'
  const params = {
    VocabularyName,
    LanguageCode: 'ja-JP',
    VocabularyFileUri: `s3://${BucketName}/${key}`
  }

  const exists = await trans
    .getVocabulary({ VocabularyName })
    .promise()
    .catch(() => false)

  if (exists) {
    await trans.updateVocabulary(params).promise()
  } else {
    await trans.createVocabulary(params).promise()
  }

  console.log(`Number of registrations: ${data.length}`)
}
