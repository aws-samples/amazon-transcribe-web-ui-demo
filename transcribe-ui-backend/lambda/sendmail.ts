import { promises as fs } from 'fs'
import * as crypto from 'crypto'
import * as AWS from 'aws-sdk'
import * as lambda from 'aws-lambda'
import * as iconv from 'iconv-lite'

AWS.config.update({ region: process.env.AWS_REGION })

const ddb = new AWS.DynamoDB({ apiVersion: '2012-08-10' })
const s3 = new AWS.S3({ apiVersion: '2006-03-01' })
const trans = new AWS.TranscribeService({ apiVersion: '2017-10-26' })
const ses = new AWS.SES({ apiVersion: '2010-12-01' })

const BucketName = process.env.TRANSCRIBE_BUCKET as string
const JobTable = process.env.JOB_TABLE as string
const FromAddress = process.env.FROM_ADDRESS as string

const formatTranscription = async (
  attachmentFilePath: string,
  encoding = 'utf8'
) => {
  const data = JSON.parse(
    await fs.readFile(attachmentFilePath, { encoding: 'utf8' })
  )
  let dictationResult = ''

  if (!data['results']['speaker_labels']) {
    dictationResult = data['results']['transcripts'][0]['transcript']
  } else {
    const segments = data['results']['speaker_labels']['segments']
    const items = data['results']['items']
    const speakers: string[] = []

    let prevSpecker = ''

    for (const [i, segment] of segments.entries()) {
      const speaker = segment['speaker_label']
      if (!speakers.includes(speaker)) speakers.push(speaker)
      const segmentItems = segment['items']
      let sentence = ''
      for (let segmentItem of segmentItems) {
        const startTime = segmentItem['start_time']
        const endTime = segmentItem['end_time']
        const filteredItems = items.filter(
          (v: { [x: string]: string }) =>
            v['start_time'] === startTime && v['end_time'] === endTime
        )
        for (let filteredItem of filteredItems) {
          sentence += filteredItem['alternatives'][0]['content']
        }
      }

      if (prevSpecker && prevSpecker !== speaker) {
        dictationResult += '\r\n'
      }

      dictationResult += `${speaker}: ${sentence}\r\n`
      prevSpecker = speaker
    }
  }

  if (encoding === 'utf8') {
    return Buffer.from(dictationResult)
  } else {
    return iconv.encode(dictationResult, encoding)
  }
}

const sendMail = async (toAddress: string, attachmentFilePath: string) => {
  console.log(toAddress, attachmentFilePath)

  const attachment = await formatTranscription(attachmentFilePath)

  const boundary = `----boundary${crypto.randomBytes(8).toString('hex')}`
  const rawData = [
    `From: ${FromAddress}`,
    `To: ${toAddress}`,
    'Subject: 音声データ文字起こし結果',
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '\n',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    '\n',
    '本メールの添付ファイルから音声データ文字起こしの結果をご確認ください',
    `--${boundary}`,
    `Content-Type: application/octet-stream; name="transcription-${Date.now()}.txt"`,
    'Content-Transfer-Encoding: base64',
    'Content-Disposition: attachment',
    '\n',
    attachment.toString('base64').replace(/([^\0]{76})/g, '$1\n'),
    '\n',
    `--${boundary}--`
  ]

  const params = {
    Destinations: [toAddress],
    RawMessage: {
      Data: rawData.join('\n')
    },
    Source: `${FromAddress}`
  }

  const result = await ses.sendRawEmail(params).promise()
  console.log(result)
}

const sendFailureMail = async (toAddress: string, failureReason: string) => {
  console.log(toAddress, failureReason)

  const params = {
    Destination: {
      ToAddresses: [toAddress]
    },
    Message: {
      Body: {
        Text: {
          Data: `FailureReason: ${failureReason}`,
          Charset: 'utf-8'
        }
      },
      Subject: {
        Data: '音声データの文字起こし処理に失敗しました',
        Charset: 'utf-8'
      }
    },
    Source: FromAddress
  }

  await ses.sendEmail(params).promise()
}

exports.handler = async (
  event: { detail: { [key: string]: string } },
  context: lambda.Context
) => {
  console.log(event)

  const jobStatus = event.detail.TranscriptionJobStatus
  const jobName = event.detail.TranscriptionJobName

  const jobInfo = await ddb
    .getItem({
      TableName: JobTable,
      Key: { job: { S: jobName } }
    })
    .promise()

  if (!jobInfo.Item) {
    return
  }

  const toAddress = AWS.DynamoDB.Converter.unmarshall(jobInfo.Item).mail
  const audioSource = AWS.DynamoDB.Converter.unmarshall(jobInfo.Item).file

  // @ts-ignore
  const jobData = (
    await trans.getTranscriptionJob({ TranscriptionJobName: jobName }).promise()
  ).TranscriptionJob[0]

  if (jobStatus != 'COMPLETED') {
    return await sendFailureMail(
      toAddress,
      jobData.FailureReason || 'Unknown error'
    )
  }

  try {
    const data = await s3
      .getObject({
        Bucket: BucketName,
        Key: `transcription/${jobName}.json`
      })
      .promise()

    const attachmentFilePath = `/tmp/${jobName}.json`
    await fs.writeFile(attachmentFilePath, data.Body as Buffer)

    await sendMail(toAddress, attachmentFilePath)
  } catch (err) {
    console.error(err)
  } finally {
    await Promise.all([
      trans.deleteTranscriptionJob({ TranscriptionJobName: jobName }).promise(),
      ddb
        .deleteItem({
          TableName: JobTable,
          Key: { job: { S: jobName } }
        })
        .promise(),
      s3
        .deleteObject({
          Bucket: BucketName,
          Key: `${audioSource}`
        })
        .promise(),
      s3
        .deleteObject({
          Bucket: BucketName,
          Key: `transcription/${jobName}.json`
        })
        .promise()
    ])
  }
}
