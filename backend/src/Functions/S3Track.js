const AWS=require('aws-sdk');
const S3=new AWS.S3();
const DB=new AWS.DynamoDB.DocumentClient();
exports.handler = async (event) => {
    
    let response;
    const data=event.detail;
    var ARNInfo=data.userIdentity.arn
    var user=ARNInfo.split('/')
    var userName=user[user.length-1];
     if(data.eventName=='CreateBucket')
      {
       const checkTags={
           Bucket:data.requestParameters.bucketName
       }
       await S3.getBucketTagging(checkTags).promise()
       .then((value)=>{
           console.log('Tag Already Added')
       })
       .catch(async(err)=>{
           console.log(err)
           const params={
         TableName:"S3Track",
          Item:{
            BucketName:data.requestParameters.bucketName,
            UserType:data.userIdentity.type,
            EventTime:data.eventTime,
            ARN:data.userIdentity.arn,
            UserName:userName
        }
      }
      await DB.put(params).promise()
      .then((data1)=>{
          console.log("Data Added")
          response = {
              statusCode: 200,
               body: JSON.stringify('Information Added to DynamoDb'),
             };
      })
     const Tagparams={
         Bucket:data.requestParameters.bucketName,
         Tagging:{
             'TagSet':[
                 {
                     'Key':'UserName',
                     'Value':userName,
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
     }
     await S3.putBucketTagging(Tagparams).promise()
           
       })
        console.log("Create Trigered")
        
    }
  else if(data.eventName=='DeleteBucket')
  {
      console.log("Trigger")
      const params={
      TableName:"S3Track",
      Key:{
        BucketName:data.requestParameters.bucketName
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
    
    return response;
};

