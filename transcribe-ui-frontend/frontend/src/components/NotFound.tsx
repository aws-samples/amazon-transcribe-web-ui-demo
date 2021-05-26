import React from 'react'
import { useTranslation } from 'react-i18next'
import { Flashbar } from 'aws-northstar/components'

const NotFound: React.FC = () => {
  const { t: transCommon } = useTranslation('common')
  return (
    <Flashbar
      items={[
        {
          header: transCommon('notFound'),
          type: 'error',
          content: transCommon('notFoundDescription')
        }
      ]}
    />
  )
}

export default NotFound
