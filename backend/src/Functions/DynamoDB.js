const AWS=require('aws-sdk');
const DB=new AWS.DynamoDB.DocumentClient();
const TagDB=new AWS.DynamoDB();
exports.handler = async (event) => {
    
    const data=event.detail;
    const arn=data.responseElements.tableDescription
    console.log(arn)
    let response
    let ARNInfo=data.userIdentity.arn
    let user=ARNInfo.split('/')
    let userName=user[user.length-1];
    
    if(data.eventName=='CreateTable')
    {
        const testTag={
            ResourceArn:arn.tableArn
        }
        await TagDB.listTagsOfResource(testTag).promise()
        .then(async(value)=>{
            const Tags=value.Tags;
            if(Tags.length==0)
            {
                 const param={
         TableName:"DynamoDBTrack",
          Item:{
            TableName:data.requestParameters.tableName,
            UserType:data.userIdentity.type,
            EventTime:data.eventTime,
            ARN:data.userIdentity.arn,
            UserName:userName
        }
      }
      await DB.put(param).promise()
      .then((data)=>{
          console.log("Data Added")
          response = {
              statusCode: 200,
               body: JSON.stringify('Information Added to DynamoDb'),
             };
      })
      const Taginfo={
          ResourceArn:arn.tableArn,
          'Tags':[
              {
              'Key':'UserName',
              'Value':userName
              },
              {
               'Key':'CreationTime',
               'Value':data.eventTime
              },
              {
                  'Key':'UserType',
                  'Value':data.userIdentity.type
              }
              
              ]
      }
      await TagDB.tagResource(Taginfo).promise()
            }
        })
        
        console.log("Create Trigered")
       
    }
  else if(data.eventName=='DeleteTable')
  {
      console.log("Trigger")
      const params={
      TableName:"DynamoDBTrack",
      Key:{
        TableName:data.requestParameters.tableName
      }
    }
    await DB.delete(params).promise()
    .then((data)=>{
        console.log("Data deleted")
        response = {
        statusCode: 200,
        body: JSON.stringify('Information deleted from DB'),
    };
    })
  }
  return response
    
};

