const { Stack, Duration } = require('aws-cdk-lib');
const { Column, Metric, GraphWidget, MathExpression, TextWidget } = require('aws-cdk-lib/aws-cloudwatch');
const cloudwatch = require('aws-cdk-lib/aws-cloudwatch');
const EC2 = require('./ec2')


// EC2 Instance ID SandBox - 'i-070f4a99395442565'
class CdkDashboardStack extends Stack {

  constructor(scope, id, props) {
    // console.log(props) //Uncomment this to reveal the properties from bin/cdk_dashboard.js
    super(scope, id, props);

    const {EC2InstanceID, dashBoardName} = props

    const CPU = new GraphWidget({
      title: "CPUUtilization",
      stacked: false,
      height: 6,
      width: 12,
      left: [
        new Metric({
          namespace: "AWS/EC2",
          metricName: "CPUUtilization",
          period: Duration.minutes(5),
          statistic: "Average",
          dimensions: {InstanceId: EC2InstanceID}
        })
      ]
    })

    const EC2StatusChecks = new GraphWidget({
      title: "EC2 Status Checks",
      stacked: false,
      region: "us-west-2",
      period: Duration.minutes(5),
      statistic: "Average",
      height: 6,
      width: 6, 
      left: [
        new Metric({
          metricName: "StatusCheckFailed_Instance",
          namespace: "AWS/EC2",
          dimensions: {InstanceId: EC2InstanceID}
        }),
        new Metric({
          metricName: "StatusCheckFailed",
          namespace: "AWS/EC2",
          dimensionsMap: {InstanceId: EC2InstanceID}
        }),
        new Metric({
          metricName: "StatusCheckFailed_System",
          namespace: "AWS/EC2",
          dimensionsMap: {InstanceId: EC2InstanceID}
        })
      ]
    })

    const networkVolume = new GraphWidget({
      title: "Network Volume",
      stacked: false,
      
      width: 6,
      height: 6,
      left: [
        new MathExpression({
          expression: "SUM([m3, m4])",
          label:"Sum Network Traffic",
          id: "e2",
          searchRegion: "us-west-2",
          usingMetrics: {
            m3: new Metric({
              namespace: "AWS/EC2",
              metricName: "NetworkOut",
              period: Duration.minutes(5),
              statistic: "Maximum",
              unit: "BYTES",
              dimensions: {InstanceId: EC2InstanceID}
            }),
            m4: new Metric({
              namespace: "AWS/EC2",
              metricName: "NetworkIn",
              period: Duration.minutes(5),
              statistic: "Maximum",
              unit: "BYTES",
              dimensions: {InstanceId: EC2InstanceID}
            })
          }
        })
      ]
    })

    const ebsVolume = (volumeID) => new GraphWidget({
      title: "EBS Volume",
      stacked: false,
      region: "us-west-2",
      period: Duration.minutes(60),
      statistic: "Average",
      height: 6,
      width: 12,
      left: [
        new MathExpression({
          expression: "SUM([m1,m2]/60)",
          label: "iOps Sum",
          id: "e1",
          usingMetrics: {
            m1: new Metric({
              metricName: "VolumeWriteOps",
              namespace: "AWS/EBS",
              dimensionsMap: {VolumeId: volumeID}
            }),
            m2: new Metric({
              metricName: "VolumeReadOps",
              namespace: "AWS/EBS",
              dimensionsMap: {VolumeId: volumeID}
            })
          }
        }),
        new MathExpression({
          expression: "SUM([m5,m6]/1024 /1024)",
          label: "Throughput in Megabytes",
          id: "e2",
          usingMetrics: {
            m5: new Metric({
              metricName: "VolumeWriteBytes",
              namespace: "AWS/EBS",
              dimensionsMap: {VolumeId: volumeID}
            }),
            m6: new Metric({
              metricName: "VolumeReadBytes",
              namespace: "AWS/EBS",
              dimensionsMap: {VolumeId: volumeID}
            })
          }
        }),
        new Metric({
          id: "m4",
          metricName: "VolumeQueueLength",
          namespace: "AWS/EBS"
        }),
        new Metric({
          id: "m3",
          metricName: "BurstBalance",
          namespace: "AWS/EBS"
        })
      ]
    })
  
    const getE2Volumes = async (EC2InstanceID) => {
      const results = await EC2.volumeInfo(EC2InstanceID)
      return results
    }

    const dashboard = new cloudwatch.Dashboard(this, dashBoardName, {
      dashboardName: dashBoardName,
      widgets: [
        [
          new Column(CPU),
          new Column(networkVolume),
          new Column(EC2StatusChecks)
        ]
      ]
    })

    getE2Volumes(EC2InstanceID).then((results) => {
      results.forEach(volumeID => {
        dashboard.addWidgets(
          ebsVolume(volumeID)
        )
      })
    })

  }
}

module.exports = { CdkDashboardStack }
