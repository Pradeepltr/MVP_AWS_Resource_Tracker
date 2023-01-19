const S3=require('./function/S3Tagging')
exports.handler=async(event)=>{
    await S3.handler(event)
}