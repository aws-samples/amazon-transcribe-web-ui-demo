import React, { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Switch, Route } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import { AppLayout, Container } from 'aws-northstar/layouts'
import type { Notification } from 'aws-northstar/layouts/AppLayout'
import type { FlashbarMessage } from 'aws-northstar/components/Flashbar'
import {
  Flashbar,
  Header,
  LoadingIndicator,
  Overlay,
  ProgressBar
} from 'aws-northstar/components'
import SideNavigation, {
  SideNavigationItemType
} from 'aws-northstar/components/SideNavigation'
import { useTranslation } from 'react-i18next'
import Dictation from './components/Dictation'
import VocabularyList from './components/VocabularyList'
import VocabularyAdd from './components/VocabularyAdd'
import NotFound from './components/NotFound'

const App: React.FC = () => {
  const { t: transCommon } = useTranslation('common')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [notification, setNotification] = useState<Notification[]>([])
  const myRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (myRef.current) myRef.current.scrollIntoView()
  }, [notification])

  const handleNotification = (message: FlashbarMessage) => {
    setNotification([
      {
        id: uuidv4(),
        onDismiss: () => setNotification([]),
        ...message
      }
    ])
  }

  const navigation = (
    <SideNavigation
      header={{
        href: '/',
        text: transCommon('menu')
      }}
      items={[
        {
          type: SideNavigationItemType.LINK,
          text: transCommon('dictation'),
          href: '/'
        },
        {
          type: SideNavigationItemType.SECTION,
          text: transCommon('customVocabulary'),
          expanded: true,
          items: [
            {
              type: SideNavigationItemType.LINK,
              text: transCommon('list'),
              href: '/vocabulary/list'
            },
            {
              type: SideNavigationItemType.LINK,
              text: transCommon('add'),
              href: '/vocabulary/add'
            }
          ]
        }
      ]}
    />
  )

  return (
    <BrowserRouter>
      {isLoading && progress === null && (
        <Overlay>
          <Container>
            <LoadingIndicator size="large" label={transCommon('loading')} />
          </Container>
        </Overlay>
      )}
      {isLoading && progress !== null && (
        <Overlay>
          <Container style={{ minWidth: '300px' }}>
            <ProgressBar
              value={progress}
              description={transCommon('inProgress')}
            />
          </Container>
        </Overlay>
      )}
      <AppLayout
        header={<Header title={transCommon('title')} />}
        navigation={navigation}
      >
        <div ref={myRef}>
          <div style={{ marginBottom: '10px' }}>
            <Flashbar items={notification} />
          </div>
          <Switch>
            <Route
              exact
              path="/"
              render={() => (
                <Dictation
                  handleNotification={handleNotification}
                  handleIsLoading={setIsLoading}
                  handleProgress={setProgress}
                />
              )}
            />
            <Route
              path="/vocabulary/list"
              render={() => (
                <VocabularyList
                  handleNotification={handleNotification}
                  handleIsLoading={setIsLoading}
                />
              )}
            />
            <Route
              path="/vocabulary/add"
              render={() => (
                <VocabularyAdd
                  handleNotification={handleNotification}
                  handleIsLoading={setIsLoading}
                />
              )}
            />
            <Route path="*" component={NotFound} />
          </Switch>
        </div>
      </AppLayout>
    </BrowserRouter>
  )
}

export default App
