const AWS = require('aws-sdk')
const EC2Client = new AWS.EC2({region: 'us-west-2'})


// Function which pulls the EC2 metadata with the AWS SDK
const getEC2Info = async (InstanceID) => {
    let params = {Filters: [{Name: 'instance-id', Values: [InstanceID]}]}
  
    try {
        let data = await EC2Client.describeInstances(params).promise()
        let tags = data.Reservations[0].Instances[0].Tags
        let ImageID = data.Reservations[0].Instances[0].ImageId
        let InstanceType = data.Reservations[0].Instances[0].InstanceType
        let BlockDeviceMappings = data.Reservations[0].Instances[0].BlockDeviceMappings
        return [{'tags': tags, 
                 'ImageID': ImageID, 
                 'InstanceType': InstanceType, 
                 'BlockDeviceMappings': BlockDeviceMappings}]
        
    } catch (e) {
        console.log(e)
    }
  }
    
   
  const volumeInfo = async (InstanceID) => {
    const serverInfo = await getEC2Info(InstanceID)
    const driveMappings = serverInfo[0].BlockDeviceMappings
    const VolumeIDs = []
    driveMappings.forEach((item) => {
        params = item.Ebs.VolumeId
        VolumeIDs.push(params)
    })
    return VolumeIDs
  }
 
  module.exports = { volumeInfo }
