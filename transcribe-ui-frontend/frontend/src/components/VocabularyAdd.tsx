import React, {
  Fragment,
  useState,
  useEffect,
  Dispatch,
  SetStateAction
} from 'react'
import { useTranslation } from 'react-i18next'
import { Container, Grid } from 'aws-northstar/layouts'
import { Button, Input, Heading, Modal, Text } from 'aws-northstar/components'
import type { FlashbarMessage } from 'aws-northstar/components/Flashbar'
import { Cancel, SaveAlt } from '@material-ui/icons'
import RepositoryFactory from '../repositories/RepositoryFactory'
import type { Vocabulary } from '../repositories/VocabulariesRepository'

type VocabularyAddProps = {
  handleNotification: (message: FlashbarMessage) => void
  handleIsLoading: Dispatch<SetStateAction<boolean>>
}

const VocabularyAdd: React.FC<VocabularyAddProps> = ({
  handleNotification,
  handleIsLoading
}: VocabularyAddProps) => {
  const { t: transCommon } = useTranslation('common')
  const { t: transVocabularies } = useTranslation('vocabularies')
  const [isMounted, setIsMounted] = useState<boolean>(false)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [inputList, setInputList] = useState<Vocabulary[]>([
    { phrase: '', display: '' }
  ])
  const [inputErrorList, setInputErrorList] = useState<Vocabulary[]>([
    { phrase: '', display: '' }
  ])
  const vocabularies = RepositoryFactory.get('vocabularies')

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const validateInputs = (): boolean => {
    const errors: Vocabulary[] = []
    inputList.map((input, index) => {
      errors.push({ phrase: '', display: '' })
      if (input['phrase'].length > 256) {
        errors[index]['phrase'] = transVocabularies('invalidPhraseOver256Chars')
      } else if (input['phrase'].length === 0) {
        errors[index]['phrase'] = transVocabularies('invalidPhraseRequired')
      } else if (/^[ぁ-んー]*$/.test(input['phrase']) === false) {
        errors[index]['phrase'] = transVocabularies('invalidPhraseNotKana')
      }
      if (input['display'].length > 256) {
        errors[index]['display'] = transVocabularies(
          'invalidDisplayOver256Chars'
        )
      } else if (input['display'].length === 0) {
        errors[index]['display'] = transVocabularies('invalidDisplayRequired')
      }
    })
    setInputErrorList(errors)
    return (
      errors.some(
        (error) => error['phrase'] !== '' || error['display'] !== ''
      ) === false
    )
  }

  useEffect(() => {
    if (isMounted) validateInputs()
  }, [inputList])

  const handleChangeInput = <P extends keyof Vocabulary>(
    name: P,
    value: Vocabulary[P],
    index: number
  ) => {
    const list = [...inputList]
    list[index][name] = value
    setInputList(list)
  }

  const handleClickAddButton = () => {
    setInputErrorList([...inputErrorList, { phrase: '', display: '' }])
    setInputList([...inputList, { phrase: '', display: '' }])
  }

  const handleClickRemoveButton = (index: number) => {
    let list = [...inputList]
    list.splice(index, 1)
    setInputList(list)
    list = [...inputErrorList]
    list.splice(index, 1)
    setInputErrorList(list)
  }

  const handleClickModalOpenButton = () => {
    const isValid = validateInputs()
    if (isValid) setIsModalOpen(true)
  }

  const handleClickSaveButton = async () => {
    handleIsLoading(true)
    await vocabularies.add(inputList)
    setInputList([])
    setIsModalOpen(false)
    handleIsLoading(false)
    handleNotification({
      header: transVocabularies('addRequestSucceeded'),
      content: transVocabularies('addRequestSucceededDescription'),
      type: 'success',
      dismissible: true
    })
  }

  return (
    <Grid container spacing={1}>
      <Modal
        title={transVocabularies('addVocabulary')}
        visible={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <Grid container spacing={1}>
          <Grid item xs={12}>
            <Text>{transVocabularies('addConfirm')}</Text>
          </Grid>
          <Grid item xs={12}>
            <hr
              style={{
                border: 'none',
                height: '1px',
                backgroundColor: '#eee'
              }}
            />
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
                <Button variant="primary" onClick={handleClickSaveButton}>
                  <SaveAlt />
                  &nbsp;{transVocabularies('saveVocabulary')}
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Modal>
      <Grid item xs={12}>
        <Container
          headingVariant="h2"
          title={transVocabularies('addVocabulary')}
        >
          <Grid container spacing={1}>
            {inputList.length === 0 ? (
              <div style={{ marginBottom: '20px' }}>
                <Text>{transVocabularies('notExists')}</Text>
              </div>
            ) : (
              <>
                <Grid item xs={5}>
                  <Heading variant="h4">{transVocabularies('phrase')}</Heading>
                </Grid>
                <Grid item xs={5}>
                  <Heading variant="h4">{transVocabularies('display')}</Heading>
                </Grid>
                <Grid item xs={2}></Grid>
              </>
            )}
            {inputList.map((value, index) => (
              <Fragment key={index}>
                <Grid item xs={5}>
                  <Input
                    onChange={(value) => {
                      handleChangeInput('phrase', value, index)
                    }}
                    placeholder="えーだぶりゅーえす"
                    type="text"
                    value={value.phrase}
                    invalid={inputErrorList[index]['phrase'] !== ''}
                  />
                  <Text color="error">{inputErrorList[index]['phrase']}</Text>
                </Grid>
                <Grid item xs={5}>
                  <Input
                    onChange={(value) => {
                      handleChangeInput('display', value, index)
                    }}
                    placeholder="AWS"
                    type="text"
                    value={value.display}
                    invalid={inputErrorList[index]['display'] !== ''}
                  />
                  <Text color="error">{inputErrorList[index]['display']}</Text>
                </Grid>
                <Grid item xs={2}>
                  <Button onClick={() => handleClickRemoveButton(index)}>
                    {transVocabularies('remove')}
                  </Button>
                </Grid>
              </Fragment>
            ))}
            <Grid item xs={12}>
              <Button onClick={handleClickAddButton}>
                {transVocabularies('add')}
              </Button>
            </Grid>
          </Grid>
        </Container>
      </Grid>
      <Grid item xs={12}>
        <Grid container item justify="flex-end">
          <Button
            variant="primary"
            onClick={handleClickModalOpenButton}
            disabled={inputList.length === 0}
          >
            <SaveAlt />
            &nbsp;{transVocabularies('saveVocabulary')}
          </Button>
        </Grid>
      </Grid>
    </Grid>
  )
}

export default VocabularyAdd
