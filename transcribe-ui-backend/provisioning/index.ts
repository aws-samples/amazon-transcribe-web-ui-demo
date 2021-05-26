#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from '@aws-cdk/core'
import { BackendStack } from './lib/stack/backend'

const app = new cdk.App()
const backend = new BackendStack(app, 'Backend')
