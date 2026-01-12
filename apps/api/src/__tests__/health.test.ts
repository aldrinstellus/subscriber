import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';

// Create a minimal test app
const app = express();
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

describe('Health Endpoint', () => {
  it('should return 200 OK', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
  });

  it('should return status ok', async () => {
    const response = await request(app).get('/health');
    expect(response.body.status).toBe('ok');
  });

  it('should include timestamp', async () => {
    const response = await request(app).get('/health');
    expect(response.body.timestamp).toBeDefined();
    expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
  });
});
