#!/usr/bin/env node

const cdk = require('aws-cdk-lib');
const { CdkDashboardStack } = require('../lib/cdk_dashboard-stack');

const app = new cdk.App();
new CdkDashboardStack(app, 'AL-TestServer', { EC2InstanceID: 'InstanceID', dashBoardName: 'ServerName' });
new CdkDashboardStack(app, 'AL-LinuxTest', { EC2InstanceID: 'InstanceID', dashBoardName: 'ServerName' });
