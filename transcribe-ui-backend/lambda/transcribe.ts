import * as crypto from 'crypto'
import * as AWS from 'aws-sdk'
import * as lambda from 'aws-lambda'
AWS.config.update({ region: process.env.AWS_REGION })

const ddb = new AWS.DynamoDB({ apiVersion: '2012-08-10' })
const trans = new AWS.TranscribeService({ apiVersion: '2017-10-26' })

const BucketName = process.env.TRANSCRIBE_BUCKET as string
const JobTable = process.env.JOB_TABLE as string

const template = {
  statusCode: 200,
  body: '',
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': '*',
    'Access-Control-Allow-Credentials': 'true'
  }
}

exports.handler = async (
  event: lambda.APIGatewayEvent,
  context: lambda.Context
) => {
  try {
    console.log(event.body)
    const data = JSON.parse(event.body || '{}')

    const isValid =
      data &&
      data.file &&
      typeof data.file === 'string' &&
      data.lang &&
      typeof data.lang === 'string' &&
      data.addr &&
      typeof data.addr === 'string'

    if (!isValid) {
      const err = new Error('Invalid params')
      err.statusCode = 400
      throw err
    }

    // generate unique job name
    const jobName = [
      'job',
      ~~(Date.now() / 1000),
      data.addr
        .match(/[a-z0-9@]/g)
        .join('')
        .replace(/@/g, '_'),
      crypto.randomBytes(16).toString('hex')
    ].join('-')

    await ddb
      .putItem({
        TableName: JobTable,
        Item: {
          job: { S: jobName },
          mail: { S: data.addr },
          file: { S: data.file },
          expire: { N: ~~(Date.now() / 1000) + 86400 + '' }
        }
      })
      .promise()

    const params: AWS.TranscribeService.StartTranscriptionJobRequest = {
      Media: {
        MediaFileUri: `s3://${BucketName}/${data.file}`
      },
      TranscriptionJobName: jobName,
      Settings: {},
      LanguageCode: data.lang,
      OutputBucketName: BucketName,
      OutputKey: `transcription/${jobName}.json`
    }

    const VocabularyName = 'Transcribe-Proto-Vocabularies'
    const exists = await trans
      .getVocabulary({ VocabularyName })
      .promise()
      .catch(() => false)

    if (exists && data.lang === 'ja-JP') {
      params.Settings!.VocabularyName = VocabularyName
    }

    if (data.num && typeof data.num === 'number' && data.num > 1) {
      params.Settings!.MaxSpeakerLabels = data.num
      params.Settings!.ShowSpeakerLabels = true
    }

    await trans.startTranscriptionJob(params).promise()

    console.log(`Start transcription job: ${jobName}`)
    console.log(params)

    return {
      ...template,
      ...{
        statusCode: 200,
        body: JSON.stringify({ job: jobName })
      }
    }
  } catch (err) {
    console.log(err)
    return {
      ...template,
      ...{
        statusCode: err.statusCode || 500,
        body: JSON.stringify({ error: err.message })
      }
    }
  }
}
