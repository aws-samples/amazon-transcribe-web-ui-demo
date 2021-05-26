import React, { useState, Dispatch, SetStateAction, useEffect } from 'react'
import {
  Button,
  Input,
  KeyValuePair,
  Modal,
  Text
} from 'aws-northstar/components'
import { Container, Grid, Stack } from 'aws-northstar/layouts'
import ColumnLayout, { Column } from 'aws-northstar/layouts/ColumnLayout'
import type { FlashbarMessage } from 'aws-northstar/components/Flashbar'
import { Cancel, Translate } from '@material-ui/icons'
import { useTranslation } from 'react-i18next'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import Evaporate from 'evaporate'
import Md5 from 'js-md5'
import { sha256 as Sha256 } from 'js-sha256'
import { v4 as uuidv4 } from 'uuid'
import RepositoryFactory from '../repositories/RepositoryFactory'
import type { Language, Transcribe } from '../repositories/TranscribeRepository'
import SelectBox from './SelectBox'
import FileUpload from './FileUpload'

type DictationInput = {
  file: File | null
  lang: Language
  num: number
  addr: string
}

type DictationInputError = {
  file: string
  addr: string
}

type DictationProps = {
  handleNotification: (message: FlashbarMessage) => void
  handleIsLoading: Dispatch<SetStateAction<boolean>>
  handleProgress: Dispatch<SetStateAction<number | null>>
}

const Dictation: React.FC<DictationProps> = ({
  handleNotification,
  handleIsLoading,
  handleProgress
}: DictationProps) => {
  const { t: transCommon } = useTranslation('common')
  const { t: transDictation } = useTranslation('dictation')
  const [isMounted, setIsMounted] = useState<boolean>(false)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [input, setInput] = useState<DictationInput>({
    file: null,
    lang: 'ja-JP',
    num: 2,
    addr: ''
  })
  const [inputError, setInputError] = useState<DictationInputError>({
    file: '',
    addr: ''
  })
  const transcribe = RepositoryFactory.get('transcribe')
  const evaporate = new Evaporate({
    awsRegion: process.env.REACT_APP_AWS_REGION,
    signerUrl: `${process.env.REACT_APP_API_ENDPOINT}/sign`,
    bucket: process.env.REACT_APP_S3_BUCKET!,
    aws_key: process.env.REACT_APP_AWS_ACCESS_KEY,
    cloudfront: true,
    sendCanonicalRequestToSignerUrl: true,
    logging: false,
    computeContentMd5: true,
    cryptoHexEncodedHash256: (data) => {
      const crypto = Sha256.create()
      crypto.update(data!)
      return crypto.hex()
    },
    cryptoMd5Method: (data) => {
      const crypto = Md5.create()
      crypto.update(data)
      return crypto.base64()
    }
  })

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (isMounted) validateEmailInput(input['addr'])
  }, [input['addr']])

  const validateEmailInput = (addr: string): boolean => {
    let error = ''
    if (addr.length > 255) {
      error = transDictation('invalidEmailOver255Chars')
    } else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr) === false) {
      error = transDictation('invalidEmailFormat')
    }
    setInputError({ ...inputError, addr: error })
    return error === ''
  }

  useEffect(() => {
    if (isMounted) validateFileInput(input['file'])
  }, [input['file']])

  const validateFileInput = (file: File | null): boolean => {
    let error = ''
    if (file === null) {
      error = transDictation('invalidFileEmpty')
    } else if (file.size > 2147483648) {
      error = transDictation('invalidFileSize')
    }
    setInputError({ ...inputError, file: error })
    return error === ''
  }

  const handleChangeEmailInput = (addr: string) => {
    setInput({ ...input, addr })
  }

  const handleClickModalOpenButton = () => {
    const isValid =
      validateEmailInput(input['addr']) && validateFileInput(input['file'])
    if (isValid) {
      setIsModalOpen(true)
    }
  }

  const handleClickDictationButton = () => {
    handleIsLoading(true)
    const fileName = uuidv4()
    evaporate.add({
      name: fileName,
      file: input['file']!,
      progress: (progress: any) => {
        handleProgress(Math.floor(progress * 90))
      },
      complete: async () => {
        const payload: Transcribe = {
          ...input,
          file: fileName
        }
        try {
          await transcribe.start(payload)
          handleNotification({
            header: transDictation('dictationRequestSucceeded'),
            content: transDictation('dictationRequestDescription'),
            type: 'success',
            dismissible: true
          })
        } catch (err) {
          handleNotification({
            header: transDictation('dictationRequestFailed'),
            content: transDictation('dictationRequestFailedDescription'),
            type: 'error',
            dismissible: true
          })
        } finally {
          handleProgress(null)
          handleIsLoading(false)
          setIsModalOpen(false)
        }
      }
    })
  }

  const languages = [
    { label: transCommon('japanese'), value: 'ja-JP' },
    { label: transCommon('usEnglish'), value: 'en-US' },
    { label: transCommon('ukEnglish'), value: 'en-GB' }
  ]
  const language = languages.find((lng) => lng.value === input['lang'])
  const langValue = language ? language['label'] : ''

  const speakerNumbers = [...Array(10)].map((_, i) => ({
    label: String(i + 1),
    value: String(i + 1)
  }))

  const acceptMimeTypes = [
    'audio/mpeg',
    'audio/ogg',
    'audio/wav',
    'audio/x-flac',
    'audio/amr',
    'audio/webm',
    'video/mp4',
    'video/webm'
  ]

  return (
    <Grid container spacing={1}>
      <Modal
        title={transDictation('startDictation')}
        visible={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <Grid container spacing={1}>
          <Grid item xs={12}>
            <Text>{transDictation('startDictationConfirm')}</Text>
          </Grid>
          <Grid item xs={12}>
            <ColumnLayout>
              <Column key="column1">
                <Stack>
                  <KeyValuePair
                    label={transDictation('fileName')}
                    value={input['file'] ? input['file'].name : ''}
                  ></KeyValuePair>
                  <KeyValuePair
                    label={transDictation('language')}
                    value={langValue}
                  ></KeyValuePair>
                </Stack>
              </Column>
              <Column key="column2">
                <Stack>
                  <KeyValuePair
                    label={transDictation('numberOfSpeakers')}
                    value={input['num']}
                  ></KeyValuePair>
                  <KeyValuePair
                    label={transDictation('receiptAddress')}
                    value={input['addr']}
                  ></KeyValuePair>
                </Stack>
              </Column>
            </ColumnLayout>
          </Grid>
          <Grid item xs={12}>
            <Grid container justify="flex-end" spacing={1}>
              <Grid item>
                <Button onClick={() => setIsModalOpen(false)}>
                  <Cancel />
                  &nbsp;{transCommon('cancel')}
                </Button>
              </Grid>
              <Grid item>
                <Button variant="primary" onClick={handleClickDictationButton}>
                  <Translate />
                  &nbsp;{transDictation('startDictation')}
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Modal>
      <Grid item xs={12}>
        <Container
          gutters={true}
          headingVariant="h4"
          title={transDictation('chooseFile')}
          subtitle={transDictation('validFileType')}
        >
          <DndProvider backend={HTML5Backend}>
            <FileUpload
              description={transDictation('uploadDescription')}
              acceptMimeTypes={acceptMimeTypes}
              setFile={(file: File) => setInput({ ...input, file })}
              error={inputError['file']}
            />
          </DndProvider>
        </Container>
      </Grid>
      <Grid item xs={12}>
        <Container
          headingVariant="h4"
          title={transDictation('dictationConfig')}
        >
          <Grid container spacing={1}>
            <Grid item xs={12}>
              <Text>{transDictation('language')}</Text>
            </Grid>
            <Grid item xs={12}>
              <SelectBox
                onChange={(lang) =>
                  setInput({ ...input, lang: lang as Language })
                }
                options={languages}
                value={String(input['lang'])}
              />
            </Grid>
            <Grid item xs={12}>
              <Text>{transDictation('numberOfSpeakers')}</Text>
            </Grid>
            <Grid item xs={12}>
              <SelectBox
                onChange={(num) => setInput({ ...input, num: Number(num) })}
                options={speakerNumbers}
                value={String(input['num'])}
              />
            </Grid>
            <Grid item xs={12}>
              <Text variant="p">{transDictation('receiptAddress')}</Text>
            </Grid>
            <Grid item xs={12}>
              <Input
                placeholder="recipient@example.com"
                type="email"
                onChange={handleChangeEmailInput}
                invalid={inputError['addr'] !== ''}
              />
              <Text color="error">{inputError['addr']}</Text>
            </Grid>
          </Grid>
        </Container>
      </Grid>
      <Grid item xs={12}>
        <Grid container justify="flex-end" spacing={1}>
          <Grid item>
            <Button
              variant="primary"
              onClick={handleClickModalOpenButton}
              disabled={input['addr'] === '' || input['file'] === null}
            >
              <Translate />
              &nbsp;{transDictation('startDictation')}
            </Button>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  )
}

export default Dictation
