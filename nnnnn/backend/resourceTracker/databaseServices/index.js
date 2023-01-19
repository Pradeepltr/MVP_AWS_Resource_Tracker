const dynamodb=require('./function/dynamodbTagging')
exports.handler=async(event)=>{
await dynamodb.handler(event)
}