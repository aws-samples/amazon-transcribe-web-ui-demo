#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from '@aws-cdk/core'
import { FrontendStack } from './lib/stack/frontend'

const app = new cdk.App()
const frontend = new FrontendStack(app, 'Frontend')
