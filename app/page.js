'use client';
import { useState } from 'react';
import { Box, Button, TextField, Typography } from '@mui/material';

export default function Home() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm the Rate My Professor support assistant. How can I help you today?",
    },
  ]);

  const sendMessage = async () => {
    if (!message.trim()) return; // Prevent sending empty messages

    setMessages((prevMessages) => [
      ...prevMessages,
      { role: 'user', content: message },
      { role: 'assistant', content: '...' }, // Placeholder until response
    ]);
    setMessage('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([...messages, { role: 'user', content: message }]),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let result = '';

      const processText = async ({ done, value }) => {
        if (done) return result;
        const text = decoder.decode(value || new Uint8Array(), { stream: true });
        setMessages((prevMessages) => {
          const lastMessage = prevMessages[prevMessages.length - 1];
          const otherMessages = prevMessages.slice(0, prevMessages.length - 1);
          return [...otherMessages, { ...lastMessage, content: lastMessage.content + text }];
        });
        return reader.read().then(processText);
      };

      reader.read().then(processText);
    } catch (error) {
      console.error("Error fetching the response:", error);
      setMessages((prevMessages) => [
        ...prevMessages.slice(0, prevMessages.length - 1),
        { role: 'assistant', content: 'There was an error processing your request.' },
      ]);
    }
  };

  return (
    <Box 
      width="100vw" 
      height="100vh" 
      display="flex" 
      flexDirection="column" 
      justifyContent="space-between"  // Ensure chat is scrollable and input stays at the bottom
      alignItems="center"  
      bgcolor="#2c2c2c"
    >
      {/* Title Section */}
      <Typography 
        variant="h4" 
        gutterBottom 
        color="#e0e0e0" 
        textAlign="center"
        style={{ marginTop: '16px' }}  // Add some spacing to the top
      >
        Rate My Professor Assistant
      </Typography>

      {/* Chat Section */}
      <Box 
        style={{ 
          overflowY: 'auto',  // Make the chat section scrollable
          flexGrow: 1,  // Ensure the chat section grows to fill space
          padding: '10px', 
          backgroundColor: '#424242', 
          borderRadius: '8px',
          width: '100%', 
          maxWidth: '600px',  // Chat container width matches textbox width
          margin: '0 auto',
          boxSizing: 'border-box'
        }}
      >
        {messages.map((msg, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              mb: 2,
            }}
          >
            <Typography
              sx={{
                backgroundColor: msg.role === 'user' ? '#ff4081' : '#9b59b6',
                color: '#e0e0e0',
                padding: '12px',
                borderRadius: '16px',
                maxWidth: '70%',
                wordWrap: 'break-word',
                boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
                fontSize: '16px',
              }}
            >
              <strong>{msg.role === 'user' ? 'You' : 'Assistant'}:</strong> {msg.content}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Input and Button aligned to bottom */}
      <Box 
        display="flex" 
        alignItems="center" 
        width="100%" 
        maxWidth="600px"  // Input and button width same as chat box
        margin="0 auto"
        style={{ padding: '8px', boxSizing: 'border-box' }}
      >
        <TextField
          variant="outlined"
          label="Your Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') sendMessage();
          }}
          style={{ 
            flexGrow: 1,  // Make input take available space
            marginRight: '8px',  // Space between input and button
            backgroundColor: '#424242', 
            borderRadius: '8px',
          }}
          InputLabelProps={{ style: { color: '#e0e0e0' } }}
          InputProps={{ style: { color: '#e0e0e0' } }}
        />
        <Button 
          onClick={sendMessage} 
          variant="contained" 
          color="primary" 
          style={{ 
            backgroundColor: '#ff4081', 
            height: '56px',  // Align with input field height
          }}
        >
          SEND
        </Button>
      </Box>
    </Box>
  );
}








