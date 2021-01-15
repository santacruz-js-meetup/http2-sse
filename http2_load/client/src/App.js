import logo from './logo.svg';
import './App.css';
import React, { useState, useEffect } from 'react';

function App() {

  const [ reqs, setReqs ] = useState([]);
  const [ listening, setListening ] = useState(false);

  useEffect( () => {
    if (!listening) {
      const events = new EventSource('https://localhost:3000/events');
      events.onmessage = (event) => {
        const parsedData = JSON.parse(event.data);
        setReqs((reqs) => reqs.concat(parsedData));
      };
      setListening(true);
    }
  }, [listening, reqs]);

  const onClick = (e) => {
    const data = {reqId: Date.now(), temperature: 20 };
    const r = fetch('/job', {
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      mode: 'same-origin', // no-cors, *cors, same-origin
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      credentials: 'same-origin', // include, *same-origin, omit
      headers: {
        'Content-Type': 'application/json'
      },
      referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      body: JSON.stringify(data), // body data type must match "Content-Type" header
    });

  };

  return (
    <div>
      <input type="button" value="Add" onClick={onClick} />
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
