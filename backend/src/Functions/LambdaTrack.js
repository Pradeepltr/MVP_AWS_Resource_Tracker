const AWS=require('aws-sdk');
const DB=new AWS.DynamoDB.DocumentClient();
const lambda=new AWS.Lambda();
exports.handler = async (event) => {
    
    console.log(event)
    let response
    const data=event.detail;
    const eventName=data.eventName
    let FunctionName=data.requestParameters.functionName
    let FunctionRegion=data.awsRegion
    let ARNInfo=data.userIdentity.arn
    let userType=data.userIdentity.type
    let eventTime=data.eventTime
    let user=ARNInfo.split('/')
    let userName=user[user.length-1]
    if(eventName.includes('CreateFunction'))
    {
    const FunctionARN=data.responseElements.functionArn;
    const TagCheck={
        Resource:FunctionARN
    }
    await lambda.listTags(TagCheck).promise()
    .then(async(value)=>{
        const val=JSON.stringify(value.Tags)
        if(val=='{}')
        {
            const params={
                TableName:"LambdaTrack",
                Item:{
                FunctionName:FunctionName,
                UserType:userType,
                EventTime:eventTime,
                ARN:ARNInfo,
                Region:FunctionRegion,
                UserName:userName
            }
        }
        await DB.put(params).promise()
        const setTags={
            Resource:FunctionARN,
            'Tags':{
                UserName:userName,
                UserType:userType,
                CreationTime:eventTime
            }
        }
        await lambda.tagResource(setTags).promise()
        console.log('data Added')
        response={
            'statusCode':200,
            'body':JSON.stringify(('All data Added'))
        }
        }
    })
    }else if(eventName.includes('DeleteFunction'))
    {
        console.log('Triggered')
      const params={
      TableName:"LambdaTrack",
      Key:{
        FunctionName:FunctionName
      }
    }
    await DB.delete(params).promise()
    .then((data)=>{
        console.log("Data deleted")
    })
    }
    
  
    return response;
};
