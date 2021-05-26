# 音声ファイルの文字起こしシステム

## 概要

音声データをテキストに変換するサービス [Amazon Transcribe](https://aws.amazon.com/jp/transcribe/) を利用し、Web 画面へアップロードされた音声および動画ファイルの文字起こしと、書き起こされたテキストデータのメール送付を行うサンプルです。

音声・動画データは [Amazon Simple Storage Service](https://aws.amazon.com/jp/s3/) に保存され、日本語、アメリカ英語、イギリス英語のうちいずれかで発話された録音内容について、最大 2 GB までのデータを文字起こしすることが可能です。話者識別にも対応しており、1 人から 10 人までの話者を識別した書き起こしを行うことができます。書き起こされたテキストデータは、[Amazon Simple Email Service](https://aws.amazon.com/jp/ses/) を使いメール添付のかたちで、特定のアドレス宛に配信されます。

また、Amazon Transcribe の[カスタム語彙](https://docs.aws.amazon.com/transcribe/latest/dg/how-vocabulary.html)機能にも対応 (日本語のみ) し、うまく文字起こしができない単語について、新規語彙としての登録が可能となっています。これにより、たとえば「えーだぶりゅーえす」といった発音の単語を「AWS」と書き起こすように設定することができます。

## アーキテクチャ

フロントエンドとなる Single Page Application は [React v17](https://ja.reactjs.org/) で実装されています。また、バックエンドを構成する [AWS Lambda](https://aws.amazon.com/jp/lambda/) の各関数は [TypeScript 4.2](https://www.typescriptlang.org/) にて実装されています。

AWS リソースをデプロイする IaC ツールとしては、[AWS Cloud Development Kit](https://aws.amazon.com/jp/cdk/) を採用し、[TypeScript 4.2](https://www.typescriptlang.org/) で実装されています。

![Architecture](./docs/architecture.png)

## スクリーンショット

![Screenshot1](./docs/screenshot_1.png)

![Screenshot2](./docs/screenshot_2.png)

## 構築手順

### 0. 前提条件

本実装サンプルのデプロイには以下のツール、設定が必要となります。

- AWS アカウント [https://aws.amazon.com/resources/create-account/](https://aws.amazon.com/resources/create-account/)
- AWS CLI [https://docs.aws.amazon.com/ja_jp/cli/latest/userguide/cli-chap-install.html](https://docs.aws.amazon.com/ja_jp/cli/latest/userguide/cli-chap-install.html)
- AWS CLI の設定 [https://docs.aws.amazon.com/ja_jp/cli/latest/userguide/cli-chap-configure.html](https://docs.aws.amazon.com/ja_jp/cli/latest/userguide/cli-chap-configure.html)
- Node.js LTS + npm [https://nodejs.org/en/download/](https://nodejs.org/en/download/)

導入後、[設定ファイルと認証情報ファイルの設定](https://docs.aws.amazon.com/ja_jp/cli/latest/userguide/cli-configure-files.html) を参考に、認証情報ファイルを作成してください。

### 1. API に対するアクセスを許可する IP レンジを設定します。

```bash
$ cd transcribe-ui-backend

## cdk.json を編集
"allowIpRange": ["許可するIPアドレスレンジを設定(CIDR)"]
```

### 2. 文字起こしの結果を送信するメールの FROM アドレスを設定します。

```bash
$ cd transcribe-ui-backend

## cdk.json を編集
"fromAddress": "Fromのメールアドレスを設定"
```

**NOTE:** 設定するメールアドレスは [Amazon Simple Email Service](https://aws.amazon.com/jp/ses/) で `Verification Status` が `verified` になっている検証済みアドレスを指定する必要があります。検証済みアドレスが存在しない場合は、事前にコンソールから作成し、検証を完了してください。

### 3. CDK スタックを任意の環境にデプロイします。

```bash
$ cd transcribe-ui-backend
$ npm ci
$ npx cdk bootstrap
$ npx cdk deploy
```

途中、デプロイを行うかどうか尋ねる質問が表示されますので、`y` を入力します。

```bash
Do you wish to deploy these changes (y/n)? y
```

### 4. Secrets Manager にシークレット情報を登録します。

[AWS Secrets Manager](https://aws.amazon.com/jp/secrets-manager/) のコンソール画面に移動し、`Transcribe-Secret` を開き、シークレットの値に `AWS_SECRET_ACCESS_KEY` の値を設定します。

```bash
## CLI から更新する場合
$ aws secretsmanager put-secret-value --secret-id "Transcribe-Secret" --secret-string "YOUR_AWS_SECRET_ACCESS_KEY"
```

### 5. フロントエンドのアプリケーションが利用するモジュールライブラリをインストールします。

```bash
$ cd transcribe-ui-frontend/frontend
$ npm ci
```

### 6. フロントエンドで利用する環境変数を設定します。

環境変数は `transcribe-ui-frontend/frontend/.env.production` に指定します。設定内容は以下のとおりです。

- REACT_APP_API_ENDPOINT : バックエンドの API の URL を指定します。
- REACT_APP_AWS_REGION : アプリケーションが動作しているリージョンを指定します。東京リージョンの場合は `ap-northeast-1` を指定します。
- REACT_APP_S3_BUCKET : 音声ファイルが配置される S3 バケットの名称を指定します。
- REACT_APP_AWS_ACCESS_KEY : `AWS_ACCESS_KEY_ID` の値を指定します。バックエンドのデプロイ時に使用したものと同様の値を指定してください。

サンプルとしては以下のような内容となります。

```bash
## transcribe-ui-frontend/frontend/.env.production を編集
REACT_APP_API_ENDPOINT=https://be19f9example.execute-api.ap-northeast-1.amazonaws.com/prod/
REACT_APP_AWS_REGION=ap-northeast-1
REACT_APP_S3_BUCKET=bucket-transcribe-example-5a340a8c8c9
REACT_APP_AWS_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE
```

**NOTE:** バックエンド API の URL および S3 バケットの名称は、バックエンドの構築時に以下のような形式で出力されています。

```
Outputs:
...
Backend.TranscribeAPIsTranscribeAPIsrestapiEndpoint4376ABF0 = https://be19f9example.execute-api.ap-northeast-1.amazonaws.com/prod/
Backend.TranscribeStorageTranscribeStoragebucketname594F46DD = bucket-transcribe-example-5a340a8c8c9
...
```

### 7. フロントエンドのアプリケーションをビルドします。

```bash
$ cd transcribe-ui-frontend/frontend
$ npm run build
```

### 8. フロントエンドに対するアクセスを許可する IP レンジを設定します。

`transcribe-ui-frontend/cdk.json` を編集します。

```bash
$ cd transcribe-ui-frontend

## cdk.json を編集
"allowIpRange": ["許可するIPアドレスレンジを設定(CIDR)"]
```

### 9. CDK スタックを任意の環境にデプロイします。

```bash
$ cd transcribe-ui-frontend
$ npm ci
$ npx cdk bootstrap
$ npx cdk deploy
```

途中、デプロイを行うかどうか尋ねる質問が表示されますので、`y` を入力します。

```bash
Do you wish to deploy these changes (y/n)? y
```

### 10. デプロイ完了後、出力された URL にアクセスして動作確認します。

```bash
Outputs:
frontend.frontendfrontendservicefrontendendpoint4E2DF9B7 = https://61ba9c9example.cloudfront.net
```

**NOTE:** IP アドレスを制限する WAF のデプロイが完了するまで、時間を要する場合があります。

## 注意事項

- カスタム語彙の更新中は文字起こしを実行することができません。この影響を最小限とするため本サンプルでは、1 日に 1 回、定期的に更新内容が反映されるよう実装されており、画面上でのカスタム語彙の操作は文字起こしの結果に即時反省されません。更新頻度の調整に関しては CDK の実装をご確認ください。
- メールの送信には Amazon Simple Email Service (SES) を利用しています。既定では、SES を通じて送信するメールに設定可能なアドレスは、送信元、送信先ともに SES で事前に検証したものに限られます。
  - 不特定のメールアドレスへメールを送信する場合は、[こちら](https://docs.aws.amazon.com/ja_jp/ses/latest/DeveloperGuide/request-production-access.html)のドキュメントを参照の上、SES のサンドボックス制限解除を申請してください。

## API 仕様

### `/transcribe`

#### POST

音声ファイルの文字起こし処理を開始します。文字起こしの結果は設定したメールアドレスに添付ファイルとして送信されます。

**request**

```json
{
  "file": "sample.mp3",
  "addr": "recipient@example.com",
  "num": 2,
  "lang": "ja-JP"
}
```

**response**

```json
{ "job": "job-1608868080-sample_amazoncojp-de95example" }
```

### `/vocabularies`

#### GET

カスタム語彙の一覧を取得します。

**response**

```json
[
  { "phrase": "えーだぶりゅーえす", "display": "AWS" },
  { "phrase": "あまぞん", "display": "Amazon" }
]
```

### POST

カスタム語彙を追加します。追加したカスタム語彙が文字起こしに反映されるまで時間がかかります。即時反映ではないことにご注意ください。

**request**

```json
[
  { "phrase": "えーだぶりゅーえす", "display": "AWS" },
  { "phrase": "あまぞん", "display": "Amazon" }
]
```

**response**

```json
{ "n": 2 }
```

**NOTE:** カスタム語彙の更新中は、このカスタム語彙を利用するすべての文字起こし処理が失敗します。

#### DELETE

任意のカスタム語彙を削除します。

**request**

```json
[
  { "phrase": "えーだぶりゅーえす", "display": "AWS" },
  { "phrase": "あまぞん", "display": "Amazon" }
]
```

**response**

```json
{ "n": 2 }
```

**NOTE:** カスタム語彙の更新中は、このカスタム語彙を利用するすべての文字起こし処理が失敗します。

### `/sign`

#### GET

正規リクエストに基づく署名文字列を署名します。このシステムではフロントエンドから S3 にファイルをアップロードするリクエストを署名します。

**request**

```js
{
  // 正規リクエスト
  canonical_request:
    'POST\n' +
    '/sample.mp3\n' +
    'uploadId=0974a41c58834e2540563d88example\n' +
    'content-type:application/xml; charset=UTF-8\n' +
    'host:s3-ap-northeast-1.amazonaws.com\n' +
    'x-amz-date:20201201T000000Z\n\n' +
    'content-type;host;x-amz-date\n' +
    '5cf18144e2540bd37de955b905883563d8869f535535509c2da094a41example',
  // 署名文字列
  to_sign:
    'AWS4-HMAC-SHA256\n' +
    '20201201T000000Z\n' +
    '20201201/ap-northeast-1/s3/aws4_request\n' +
    '5cf18144e2540bd37de955b905883563d8869f535535509c2da094a41example',
  datetime: '20201201T000000Z'
}
```

**response**

```
5cf18144e2540bd37de955b905883563d8869f535535509c2da094a41example
```

### Error Response

```json
{ "error": "failureReason" }
```

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
