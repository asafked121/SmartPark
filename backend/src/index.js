// This file may contain content made using generative AI. This comment satisfies requirements for this courses AI disclosure policys.
const express = require('express');
const cors = require('cors');
const seed = require('./seed');

const PORT = process.env.PORT || 4000;

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`SmartPark API running on port ${PORT}`);
  await seed();
});
