import logo from './logo.svg';
import './App.css';
import React, { useState, useEffect } from 'react';

function App() {

  const [ reqs, setReqs ] = useState([]);
  const [ message, setMessage ] = useState('');
  const [ time, setTime ] = useState('');
  const [ listening, setListening ] = useState(false);

  useEffect( () => {
    if (!listening) {
      const events = new EventSource('https://localhost:3000/events');
      events.onmessage = (event) => {
        const parsedData = JSON.parse(event.data);
        setReqs((reqs) => reqs.concat(parsedData));
      };
      setListening(true);
      
      setInterval(() => {
        setTime((time) => new Date().toISOString());
      }, 1000);
    }
  }, [listening, reqs]);

  const loadJSON = callback => response => {
    const reader = response.body.getReader();
    let chunks = '';
    let msg = '';
    return pump();
  
    function pump() {
      return reader.read().then(({ value, done }) => {
        if (done) {
          // return JSON.parse(chunks);
          return
        }
        chunks += String.fromCharCode.apply(null, value);
        if (chunks.includes('\n')) {
          const split = chunks.split('\n');
          msg = split[0];
          chunks = split[1];
          // Act on the chunk of data received
          callback(msg);
        }
        return pump();
      });
    }
  }

  const onClick = (e) => {
    const data = {reqId: Date.now(), temperature: 20 };
    const r = fetch('/job', {
      method: 'POST', 
      body: JSON.stringify(data), // body data type must match "Content-Type" header
    })
    .then(loadJSON(msg => {
      setMessage(() => msg);
    }));
  };

  return (
    <div>
      <input type="button" value="Add" onClick={onClick} />
      <div>Time: {time}</div>
      <div>Message: {message}</div>
      <table className="stats-table">
      <thead>
        <tr>
          <th>reqID</th>
          <th>Temperature</th>
        </tr>
      </thead>
      <tbody>
        {
          reqs.map((req, i) =>
            <tr key={i}>
              <td>{req.reqId}</td>
              <td>{req.temperature} ℃</td>
            </tr>
          )
        }
      </tbody>
    </table>
    </div>
  );

}

export default App;
