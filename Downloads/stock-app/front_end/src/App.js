import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
    const [stocks, setStocks] = useState([]);
    const [selectedStocks, setSelectedStocks] = useState([]);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/stocks`)
            .then(response => setStocks(response.data))
            .catch(error => console.error('Error fetching stocks:', error));

        const ws = new WebSocket(`${process.env.REACT_APP_BACKEND_URL.replace('http', 'ws')}`);
        ws.onopen = () => console.log('WebSocket connected');
        ws.onmessage = event => {
            const updatedStocks = JSON.parse(event.data);
            setStocks(updatedStocks);
        };
        setSocket(ws);

        return () => {
            if (ws) ws.close();
        };
    }, []);

    const handleStockSelection = (e) => {
        const stockId = e.target.value;
        setSelectedStocks(prevSelected => {
            if (prevSelected.includes(stockId)) {
                return prevSelected.filter(id => id !== stockId);
            } else {
                return [...prevSelected, stockId];
            }
        });
    };

    const subscribeToStocks = () => {
        if (socket) {
            socket.send(JSON.stringify(selectedStocks));
        }
    };

    return (
        <div>
            <h1>Stocks App</h1>
            <p>Select up to 20 stocks:</p>
            <div>
                {stocks.map(stock => (
                    <label key={stock.symbol}>
                        <input
                            type="checkbox"
                            value={stock.symbol}
                            checked={selectedStocks.includes(stock.symbol)}
                            onChange={handleStockSelection}
                        />
                        {stock.symbol}
                    </label>
                ))}
            </div>
            <button onClick={subscribeToStocks}>Subscribe</button>
            <div>
                <h2>Live Stock Prices</h2>
                <ul>
                    {stocks.map(stock => (
                        <li key={stock.symbol}>{`${stock.symbol}: $${stock.price.toFixed(2)}`}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default App;
