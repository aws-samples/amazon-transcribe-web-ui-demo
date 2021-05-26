import React, { useState } from 'react'
import { useDrop } from 'react-dnd'
import { useTranslation } from 'react-i18next'
import { NativeTypes } from 'react-dnd-html5-backend'
import { useFileUpload } from 'use-file-upload'
import { Button, Overlay, Text, Table } from 'aws-northstar/components'
import { Box, Grid } from 'aws-northstar/layouts'
import { CloudUpload } from '@material-ui/icons'

type FileUploadProps = {
  description: string
  acceptMimeTypes: string[]
  setFile: (file: File) => void
  error?: string
}

const FileUpload: React.FC<FileUploadProps> = ({
  description,
  acceptMimeTypes,
  setFile,
  error = ''
}: FileUploadProps) => {
  const { t: transCommon } = useTranslation('common')
  const [uploadFile, setUploadFile] = useState<File>()
  const [, selectFile] = useFileUpload()
  const [{ canDrop }, drop] = useDrop({
    accept: [NativeTypes.FILE],
    drop(item, monitor) {
      const droppedFile = monitor.getItem().files[0]
      if (acceptMimeTypes.includes(droppedFile.type)) {
        setUploadFile(droppedFile)
        setFile(droppedFile)
      }
    },
    collect: (monitor) => {
      return {
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop()
      }
    }
  })

  const handleClickUploadButton = () => {
    selectFile(
      {
        accept: acceptMimeTypes.join(),
        multiple: false
      },
      ({ file }: any) => {
        setUploadFile(file)
        setFile(file)
      }
    )
  }

  const columnDefinitions = [
    {
      id: 'fileName',
      Header: transCommon('fileName'),
      accessor: 'fileName',
      minWidth: 400
    },
    {
      id: 'fileSize',
      Header: transCommon('fileSize'),
      accessor: 'fileSize',
      minWidth: 200
    }
  ]

  let items: any[] = []
  if (uploadFile) {
    items = [
      {
        fileName: uploadFile.name,
        fileSize: uploadFile.size
      }
    ]
  }

  return (
    <Grid container spacing={1}>
      <Grid item xs={12}>
        <div
          ref={drop}
          style={{
            borderStyle: 'dashed',
            borderWidth: 'thin',
            borderColor: '#99cbe4'
          }}
        >
          <Box p={2}>
            <Grid container item justify="center">
              <Text>{description}</Text>
            </Grid>
          </Box>
          {canDrop && <Overlay />}
        </div>
      </Grid>
      {uploadFile && (
        <Grid item xs={12}>
          <Table
            columnDefinitions={columnDefinitions}
            items={items}
            disableGroupBy={true}
            disableSettings={true}
            disablePagination={true}
            disableFilters={true}
            disableRowSelect={true}
            disableSortBy={true}
          />
        </Grid>
      )}
      {error !== '' && (
        <Grid item xs={12}>
          <Text color="error">{error}</Text>
        </Grid>
      )}
      <Grid container item justify="flex-end">
        <Button variant="primary" onClick={handleClickUploadButton}>
          <CloudUpload />
          &nbsp;{transCommon('upload')}
        </Button>
      </Grid>
    </Grid>
  )
}

export default FileUpload
