import React, { useState } from 'react';

function TestAI() {
  const [input, setInput] = useState('');
  const [results, setResults] = useState([]);

  const handleTest = async () => {
    const response = await fetch('/api/test-filter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: input })
    });
    const data = await response.json();
    setResults([data, ...results]);
    setInput('');
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>AI Filter Test</h2>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter test message"
        rows={3}
        style={{ width: '100%' }}
      />
      <button onClick={handleTest}>Test Filter</button>
      
      <div style={{ marginTop: '2rem' }}>
        {results.map((result, i) => (
          <div key={i} style={{ borderBottom: '1px solid #ccc', padding: '1rem' }}>
            <p><strong>Original:</strong> {result.original}</p>
            <p><strong>Filtered:</strong> {result.filtered}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TestAI; 