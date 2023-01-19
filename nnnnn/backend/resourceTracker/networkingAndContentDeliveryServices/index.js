const ApiGateway=require('./function/ApiGatewayTagging')
exports.handler=async(event)=>{
await ApiGateway.handler(event)
}