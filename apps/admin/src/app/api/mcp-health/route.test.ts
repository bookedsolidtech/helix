import { describe, it, expect } from 'vitest';
import { GET } from './route';

describe('GET /api/mcp-health', () => {
  it('returns a Response object', async () => {
    const response = await GET();
    expect(response).toBeInstanceOf(Response);
  }, 15000);

  it('returns JSON content type', async () => {
    const response = await GET();
    const contentType = response.headers.get('content-type');
    expect(contentType).toContain('application/json');
  }, 15000);

  it('returns valid JSON body', async () => {
    const response = await GET();
    const body = await response.json();
    expect(body).toBeDefined();
    expect(typeof body).toBe('object');
  }, 15000);

  it('response body has status field', async () => {
    const response = await GET();
    const body = await response.json();
    expect(body).toHaveProperty('status');
    expect(['healthy', 'degraded', 'unreachable']).toContain(body.status);
  }, 15000);

  it('response body has timestamp', async () => {
    const response = await GET();
    const body = await response.json();
    expect(body).toHaveProperty('timestamp');
  }, 15000);

  it('returns 200 status code', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
  }, 15000);
});
