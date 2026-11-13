import http from 'node:http';
import { readFile } from 'node:fs/promises';
const files = { '/': ['index.html','text/html'], '/css/style.css': ['css/style.css','text/css'], '/js/app.js': ['js/app.js','text/javascript'], '/js/store.js': ['js/store.js','text/javascript'] };
http.createServer(async (req,res) => {
  const file = files[new URL(req.url,'http://localhost').pathname];
  if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
  if (!file) { res.writeHead(404); res.end('Not found'); return; }
  try { const body=await readFile(new URL(file[0],import.meta.url)); res.writeHead(200,{'Content-Type':file[1]+'; charset=utf-8','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:body); }
  catch { res.writeHead(500);res.end('Unable to read file'); }
}).listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log('Fresh market port '+(process.env.PORT||3000)));
