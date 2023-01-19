const AWS=require('aws-sdk')
const DB = new AWS.DynamoDB.DocumentClient();
exports.DbHandleDelete = async (index,userName,userType) => {
    try{
    let UpdateExpression = 'REMOVE resources[' + index + ']';
    let removeData = {
        'TableName': 'AWSResourceTracker',
        'Key': {
            userName: userName,
            userType: userType
        },
        UpdateExpression
    }
    await DB.update(removeData).promise()
}catch(err)
{
    console.log(err)
}
};