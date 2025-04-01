const express = require('express');
const cors = require('cors');
const messagesRouter = require('./routes/messages');
const contactsRouter = require('./routes/contacts');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/messages', messagesRouter);
app.use('/api/contacts', contactsRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 