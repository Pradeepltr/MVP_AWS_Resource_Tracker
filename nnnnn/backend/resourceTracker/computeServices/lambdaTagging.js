const AWS=require('aws-sdk')
const DB=new AWS.DynamoDB.DocumentClient()
const DBPut=require('./utils/DbHandlePut')
const DBDel=require('./utils/DbHandleDelete')
const lambda = new AWS.Lambda();
exports.handler = async (event) => {
    let data = event.detail
    let eventName = data.eventName
    if (eventName.includes('CreateFunction')) {
        let userType = data.userIdentity.type
        let created_at = data.eventTime
        let ARNInfo = data.userIdentity.arn
        let user = ARNInfo.split('/')
        let userName = user[user.length - 1]
        let FunctionARN = data.responseElements.functionArn
        let region=data.awsRegion
        const TagCheck = {
            Resource: FunctionARN
        }
        try{
        let tag_info = await lambda.listTags(TagCheck).promise()
        const val = JSON.stringify(tag_info.Tags)
        console.log(val)
        if (val == '{}') {
            let resourceInfo={
                resourceType: event.detail.eventSource,
                resourceName: 'Lambda Function',
                FunctionName: data.requestParameters.functionName,
            }
            await DBPut.DbHandlePut(userName,userType,created_at,region,resourceInfo,ARNInfo)
            console.log('Empty call')
            const setTags = {
                Resource: FunctionARN,
                'Tags': {
                    UserName: userName,
                    UserType: userType,
                    CreationTime: created_at
                }
            }
            await lambda.tagResource(setTags).promise()
         }
        }catch(err)
        {
            console.log(err)
        }

    } else if (eventName.includes('DeleteFunction')) {
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
            let resourceName=data.requestParameters.functionName
            let index = -1
            let list = await DB.get(param).promise()
            let val = list.Item.resources
            console.log(val)
        
            let matchVal
            for (let i = 0; i < val.length; i++) {
              
                let element = val[i]
                matchVal=element.resourceInfo.FunctionName
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