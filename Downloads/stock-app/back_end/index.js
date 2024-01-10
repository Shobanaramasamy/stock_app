const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const axios = require('axios');
const fs = require('fs');
require('dotenv').config(); 

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const stocksFile = 'stocks.json';

async function getTopStocks() {
    const apiKey = process.env.POLYGON_API_KEY;
    const response = await axios.get(`https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/gainers?apiKey=${apiKey}&limit=20`);
    return response.data.tickers.map(ticker => ({
        symbol: ticker.ticker,
        openPrice: ticker.day.open,
        refreshInterval: Math.floor(Math.random() * 5) + 1,
    }));
}

function updateStockPrices(stocks) {
    setInterval(() => {
        stocks.forEach(stock => {
            stock.price = stock.openPrice + (Math.random() - 0.5) * 5;
        });
        fs.writeFileSync(stocksFile, JSON.stringify(stocks, null, 2));
        broadcastStockPrices(stocks);
    }, 1000);
}

function broadcastStockPrices(stocks) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(stocks));
        }
    });
}

wss.on('connection', ws => {
  ws.on('message', message => {
    console.log(`Received message: ${message}`);
  });
});


getTopStocks().then(stocks => {
    fs.writeFileSync(stocksFile, JSON.stringify(stocks, null, 2));
    updateStockPrices(stocks);
});


app.get('/stocks', (req, res) => {
    const stocks = JSON.parse(fs.readFileSync(stocksFile));
    res.json(stocks);
});


const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});