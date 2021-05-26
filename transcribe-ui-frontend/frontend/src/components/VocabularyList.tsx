import React, { useState, useEffect, Dispatch, SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'
import { Grid } from 'aws-northstar/layouts'
import type { FlashbarMessage } from 'aws-northstar/components/Flashbar'
import { Button, Modal, Table, Text } from 'aws-northstar/components'
import { Cancel, Delete } from '@material-ui/icons'
import RepositoryFactory from '../repositories/RepositoryFactory'
import type { Vocabulary } from '../repositories/VocabulariesRepository'

type VocabularyListProps = {
  handleNotification: (message: FlashbarMessage) => void
  handleIsLoading: Dispatch<SetStateAction<boolean>>
}

const VocabularyList: React.FC<VocabularyListProps> = ({
  handleNotification,
  handleIsLoading
}: VocabularyListProps) => {
  const { t: transCommon } = useTranslation('common')
  const { t: transVocabularies } = useTranslation('vocabularies')
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [items, setItems] = useState<Vocabulary[]>([])
  const [selectedItems, setSelectedItems] = useState<Vocabulary[]>([])
  const [isTableLoading, setIsTableLoading] = useState<boolean>(false)
  const vocabularies = RepositoryFactory.get('vocabularies')

  const getVocabularies = async () => {
    setIsTableLoading(true)
    const response = await vocabularies.get()
    setItems(response.data)
    setIsTableLoading(false)
  }

  useEffect(() => {
    getVocabularies()
  }, [])

  const handleSelectionChange = (vocabulary: Vocabulary[]) => {
    setSelectedItems(vocabulary)
  }

  const handleClickRemoveButton = async () => {
    handleIsLoading(true)
    await vocabularies.remove(selectedItems)
    await getVocabularies()
    setIsModalOpen(false)
    handleIsLoading(false)
    handleNotification({
      header: transVocabularies('removeRequestSucceeded'),
      content: transVocabularies('removeRequestSucceededDescription'),
      type: 'success',
      dismissible: true
    })
  }

  const columnDefinitions = [
    {
      id: 'phrase',
      Header: transVocabularies('phrase'),
      accessor: 'phrase',
      minWidth: 350
    },
    {
      id: 'display',
      Header: transVocabularies('display'),
      accessor: 'display',
      minWidth: 350
    }
  ]

  return (
    <Grid container spacing={1}>
      <Modal
        title={transVocabularies('removeVocabulary')}
        visible={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <Grid container spacing={1}>
          <Grid item xs={12}>
            <Text>{transVocabularies('removeConfirm')}</Text>
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
                <Button variant="primary" onClick={handleClickRemoveButton}>
                  <Delete />
                  &nbsp;{transVocabularies('removeVocabulary')}
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Modal>
      <Grid item xs={12}>
        <Table
          loading={isTableLoading}
          tableTitle={transVocabularies('listVocabulary')}
          columnDefinitions={columnDefinitions}
          items={items}
          onSelectionChange={handleSelectionChange}
          sortBy={[
            {
              id: 'phrase',
              desc: false
            }
          ]}
        />
      </Grid>
      <Grid item xs={12}>
        <Grid container item justify="flex-end">
          <Button
            onClick={() => setIsModalOpen(true)}
            variant="primary"
            disabled={selectedItems.length === 0}
          >
            <Delete />
            &nbsp;{transVocabularies('removeCheckedVocabulary')}
          </Button>
        </Grid>
      </Grid>
    </Grid>
  )
}

export default VocabularyList
