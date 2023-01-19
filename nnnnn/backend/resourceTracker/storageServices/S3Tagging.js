const AWS=require('aws-sdk')
const S3=new AWS.S3();
const DB=new AWS.DynamoDB.DocumentClient()
const DBPut=require('./utils/DbHandlePut')
const DBDel=require('./utils/DbHandleDelete')
exports.handler = async (event) => {
    let data = event.detail
    let eventName = data.eventName
    if (eventName.includes('CreateBucket')) {
        const tagCheck = {
            Bucket: data.requestParameters.bucketName
        }
        try{
        await S3.getBucketTagging(tagCheck).promise()
        console.log('Tag already added')
        }
        catch(err) {
            let ARNInfo = data.userIdentity.arn
            let user = ARNInfo.split('/')
            let userName = user[user.length - 1]
            let userType=data.userIdentity.type
            let eventTime=data.eventTime
            let region=data.awsRegion
            let resourceInfo={
                resourceType: event.detail.eventSource,
                resourceName: 'S3 Bucket',
                BucketName: data.requestParameters.bucketName,
            }
            await DBPut.DbHandlePut(userName,userType,eventTime,region,resourceInfo,ARNInfo)
                 const params = {
                    Bucket: data.requestParameters.bucketName,
                    Tagging:{
                    'TagSet': [
                        {
                            'Key': 'UserName',
                            'Value': userName
                        },
                        {
                            'Key': 'CreatedAt',
                            'Value': data.eventTime

                        },
                        {
                            'Key': 'UserType',
                            'Value': data.userIdentity.type
                        }
                    ]
                }
                }
                await S3.putBucketTagging(params).promise()

            }
    } else if (eventName.includes('DeleteBucket')) {
        try{
            let userType = data.userIdentity.type
            let ARNInfo = data.userIdentity.arn
            let user = ARNInfo.split('/')
            let userName = user[user.length - 1]
            const param = {
                'TableName': 'AWSResourceTracker',
                'Key': {
               userName: userName,
               userType: userType
                 }
              }
            let resourceName=data.requestParameters.bucketName
            let index = -1
            let list = await DB.get(param).promise()
            let val = list.Item.resources
            console.log(val)
        
            let matchVal
            for (let i = 0; i < val.length; i++) {
              
                let element = val[i]
                matchVal=element.resourceInfo.BucketName
                if (matchVal == resourceName) {
                    console.log("True")
                    index = i
                    break
                }
            }
        await DBDel.DbHandleDelete(index,userName,userType)
    }catch(err)
    {
        console.log(err)
    }
    }

};