import * as AWS from 'aws-sdk'
import * as lambda from 'aws-lambda'
AWS.config.update({ region: process.env.AWS_REGION })

const ddb = new AWS.DynamoDB({ apiVersion: '2012-08-10' })

const TableName = process.env.VOCABULARY_TABLE as string

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

const dump = async () => {
  const data = await ddb.scan({ TableName }).promise()

  return data.Items?.map((item) => {
    return AWS.DynamoDB.Converter.unmarshall(item)
  }).sort((a, b) => {
    return a.phrase > b.phrase ? 1 : -1
  })
}

const insert = async (data: Vocabulary[]) => {
  const params: AWS.DynamoDB.BatchWriteItemInput = { RequestItems: {} }
  params.RequestItems[TableName] = data.map((item) => {
    return {
      PutRequest: {
        Item: {
          phrase: { S: item.phrase },
          display: { S: item.display }
        }
      }
    }
  })

  await ddb.batchWriteItem(params).promise()
  return { n: data.length }
}

const remove = async (data: Vocabulary[]) => {
  for (let i = 0; i < data.length; i++) {
    const params = {
      TableName,
      Key: {
        phrase: { S: data[i].phrase },
        display: { S: data[i].display }
      }
    }

    await ddb.deleteItem(params).promise()
  }
  return { n: data.length }
}

const validate = (data: Vocabulary[]) => {
  const isValid =
    Array.isArray(data) &&
    data.every((value) => {
      return (
        value.phrase &&
        typeof value.phrase === 'string' &&
        value.display &&
        typeof value.display === 'string'
      )
    })

  if (!isValid) {
    const err = new Error('Invalid params')
    err.statusCode = 400
    throw err
  }
}

interface Vocabulary {
  phrase: string
  display: string
}

exports.handler = async (
  event: lambda.APIGatewayEvent,
  context: lambda.Context
) => {
  try {
    console.log(event.body)
    const data: Vocabulary[] = JSON.parse(event.body || '{}')

    let res = null

    switch (event.httpMethod) {
      case 'GET':
        res = await dump()
        break
      case 'POST':
        validate(data)
        res = await insert(data)
        break
      case 'DELETE':
        validate(data)
        res = await remove(data)
        break
    }

    return {
      ...template,
      ...{
        statusCode: 200,
        body: JSON.stringify(res)
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
