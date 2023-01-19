const lambda=require('./function/lambdaTagging')
exports.handler= async(event)=>{
    await lambda.handler(event)
}