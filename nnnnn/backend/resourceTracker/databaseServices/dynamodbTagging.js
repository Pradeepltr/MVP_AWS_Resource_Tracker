const AWS=require('aws-sdk')
const DB=new AWS.DynamoDB.DocumentClient()
const DBTagging = new AWS.DynamoDB()
const DBPut=require('./utils/DbHandlePut')
const DBDel=require('./utils/DbHandleDelete')
exports.handler= async (event) => {
    let data = event.detail
    let eventName = data.eventName
    if (eventName.includes('CreateTable')) {
        let arn = data.responseElements.tableDescription
        const tagCheck = {
            ResourceArn: arn.tableArn
        }
        try{
        let tag_info = await DBTagging.listTagsOfResource(tagCheck).promise()
        let tags = tag_info.Tags
        let ARNInfo = data.userIdentity.arn
        let user = ARNInfo.split('/')
        let userName = user[user.length - 1]
        let userType=data.userIdentity.type
        let eventTime=data.eventTime
        let region=data.awsRegion
        if (tags.length == 0) {
            let resourceInfo={
                resourceType: event.detail.eventSource,
                resourceName: 'Table Name',
                TableName: data.requestParameters.tableName,
            }
            await DBPut.DbHandlePut(userName,userType,eventTime,region,resourceInfo,ARNInfo)
            const tableTags = {
                ResourceArn: arn.tableArn,
                'Tags': [
                    {
                        'Key': 'UserName',
                        'Value': userName
                    },
                    {
                        'Key': 'createdAt',
                        'Value': data.eventTime
                    },
                    {
                        'Key': 'UserType',
                        'Value': data.userIdentity.type
                    }
                ]
            }
            await DBTagging.tagResource(tableTags).promise()
        }
    }catch(err)
    {
        console.log(err)
    }

    } else if (eventName.includes('DeleteTable')) {

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
            let resourceName=data.requestParameters.tableName
            let index = -1
            let list = await DB.get(param).promise()
            let val = list.Item.resources
            console.log(val)
        
            let matchVal
            for (let i = 0; i < val.length; i++) {
              
                let element = val[i]
                matchVal=element.resourceInfo.TableName
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