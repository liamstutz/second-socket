import http from 'node:http';
import worker from './dist/server/index.js';
const port=Number(process.env.PORT||4173);
const server=http.createServer(async(req,res)=>{try{const chunks=[];for await(const c of req){chunks.push(c);if(chunks.reduce((s,b)=>s+b.length,0)>20000){res.writeHead(413);res.end('Request too large');return;}}const url='http://127.0.0.1:'+port+req.url;const request=new Request(url,{method:req.method,headers:req.headers,body:['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(chunks),duplex:'half'});const response=await worker.fetch(request,process.env);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));}catch(error){res.writeHead(500);res.end('Server could not complete request.');}});
server.listen(port,'127.0.0.1',()=>console.log('Second Socket local preview: http://127.0.0.1:'+port));
