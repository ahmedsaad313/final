const fs = require('fs');
const http = require('http');
const https = require('https');

const port = 3000;

const server = http.createServer();
server.on("request", request_handler);
server.on("listening", listen_handler);
server.listen(port);

function listen_handler(){
	console.log(`Now Listening on Port ${port}`);
}
function request_handler(req, res){
    console.log(req.url);
    if(req.url === "/"){
        const form = fs.createReadStream("html/index.html");
		res.writeHead(200, {"Content-Type": "text/html"})
		form.pipe(res);
    }
    else if(req.url.startsWith("/search")){
        const user_input = new URL(req.url, `https://${req.headers.host}`).searchParams;
        console.log(user_input);
        const year = user_input.get('year');
        if(year == null || year == ""){
            res.writeHead(404, {"Content-Type": "text/html"});
            res.end("<h1>Missing Input</h1>");        
        }
        else{
            const standings_api = https.request(`https://api-football-standings.azharimm.site/leagues/eng.1/standings?season=${year}&sort=asc`);
            standings_api.on("response" , standings_res => process_stream(standings_res, parse_results, res));
            standings_api.end();
        }
    }
    else{
        res.writeHead(404, {"Content-Type": "text/html"});
        res.end("<h1>Not Found</h1>");    
    }
}

function process_stream (stream, callback , ...args){
	let body = "";
	stream.on("data", chunk => body += chunk);
	stream.on("end", () => callback(body, ...args));
}

function parse_results(data, res){
    const lookup = JSON.parse(data);
    console.log(lookup);
	let results = "<h1>No Results Found</h1>";
    // if(Array.isArray(lookup)){
        // let firstDefinition = lookup[0]?.meanings[0]?.definitions[0]?.definition;
        // results = `<h1>Results:${lookup[0]?.word}</h1><p>${firstDefinition}</p>`;
    // }
    let team = lookup?.data?.standings[0]?.team?.name;
    let losses = lookup?.data?.standings[0]?.stats[1].value;
    results = `<h1>Results:</h1><p>The team that won the premier league that year was ${team} and they had ${losses} losses.</p>`;
    res.writeHead(200, {"Content-Type": "text/html"})
	res.end(results);
}
