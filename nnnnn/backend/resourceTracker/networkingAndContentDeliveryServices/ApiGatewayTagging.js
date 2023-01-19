const AWS=require('aws-sdk')
const DB=new AWS.DynamoDB.DocumentClient()
const API = new AWS.APIGateway()
const DBPut=require('./utils/DbHandlePut')
const DBDel=require('./utils/DbHandleDelete')
exports.handler = async (event) => {
    let data = event.detail
    let eventName = data.eventName
    if (eventName.includes('CreateRestApi') || eventName.includes('ImportRestApi')) {
        let region = event.region
        let ApiId = data.responseElements.id
        let ARNInfo = data.userIdentity.arn
        let user = ARNInfo.split('/')
        let userName = user[user.length - 1]
        let userType=data.userIdentity.type
        let eventTime=data.eventTime
        let ApiArn = 'arn:aws:apigateway:' + region + '::/restapis/' + ApiId
        const tag_check = {
            resourceArn: ApiArn
        }
        try{
        let tag_info = await API.getTags(tag_check).promise()
        let tags = JSON.stringify(tag_info.tags)
        if (tags == '{}') {
            let resourceInfo={
                resourceType: event.detail.eventSource,
                resourceName: 'ApiGateway',
                ApiName: data.responseElements.name,
                ApiId: data.responseElements.id
            }
            await DBPut.DbHandlePut(userName,userType,eventTime,region,resourceInfo,ARNInfo)
            const Apitags = {
                resourceArn: ApiArn,
                tags: {
                    UserName: userName,
                    CreatedAt: event.time,
                    userType: data.userIdentity.type
                }
            }
            await API.tagResource(Apitags).promise()
            response = {
                'statusCode': 200,
                'body': JSON.stringify({
                    message: 'Data Add and Tagging Done',

                })
            }
        }
    }catch(err){
        console.log(err)
    }

    } else if (eventName.includes('DeleteRestApi')) {
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
            let resourceName=data.requestParameters.restApiId
            let index = -1
            let list = await DB.get(param).promise()
            let val = list.Item.resources
            console.log(val)
        
            let matchVal
            for (let i = 0; i < val.length; i++) {
              
                let element = val[i]
                matchVal=element.resourceInfo.ApiId
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