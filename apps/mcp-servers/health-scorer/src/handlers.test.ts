import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MCPError, ErrorCategory } from '@helixui/mcp-shared';

// Create shared mock objects that will be used by all tests
const mockFileOps = {
  fileExists: vi.fn(),
  readJSON: vi.fn(),
  validatePath: vi.fn((path: string) => path),
};

const mockGit = {
  withBranch: vi.fn(<T>(branch: string, fn: () => T) => fn()),
  getCurrentBranch: vi.fn(() => 'main'),
};

// Mock file system and dependencies BEFORE importing handlers
vi.mock('node:fs', () => ({
  readdirSync: vi.fn(() => []),
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}));

vi.mock('@helixui/mcp-shared', async () => {
  const actual = await vi.importActual('@helixui/mcp-shared');

  return {
    ...actual,
    SafeFileOperations: vi.fn(() => mockFileOps),
    GitOperations: vi.fn(() => mockGit),
  };
});

// Import after mocking
const { scoreComponent, scoreAllComponents, getHealthTrend, getHealthDiff } =
  await import('./handlers.js');
const { readdirSync } = await import('node:fs');

// Type-safe mock helper for readdirSync (cast to accept string[] returns)
const mockReaddirSync = vi.mocked(readdirSync) as unknown as {
  mockReturnValue: (value: string[]) => void;
  mockImplementation: (fn: () => string[]) => void;
};

describe('MCP Server: health-scorer handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // =====================================================
  // ANTAGONISTIC: Security & Edge Cases
  // =====================================================
  describe('ANTAGONISTIC: Security & Edge Cases', () => {
    describe('scoreComponent', () => {
      it('should handle missing health history gracefully', async () => {
        mockFileOps.fileExists.mockReturnValue(false);

        await expect(scoreComponent('hx-button')).rejects.toThrow(MCPError);
        await expect(scoreComponent('hx-button')).rejects.toThrow(
          'No health history found. Run health scorer first.',
        );
      });

      it('should categorize missing history as UserInput error', async () => {
        mockFileOps.fileExists.mockReturnValue(false);

        try {
          await scoreComponent('hx-button');
          expect.fail('Should have thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(MCPError);
          expect((error as MCPError).category).toBe(ErrorCategory.UserInput);
        }
      });

      it('should handle component not in health history', async () => {
        mockFileOps.fileExists.mockReturnValue(true);
        mockReaddirSync.mockReturnValue(['2026-02-17.json']);
        mockFileOps.readJSON.mockReturnValue({
          timestamp: '2026-02-17T00:00:00Z',
          components: [{ tagName: 'hx-card', score: 85, grade: 'B', dimensions: {}, issues: [] }],
        });

        await expect(scoreComponent('hx-nonexistent')).rejects.toThrow(MCPError);
        await expect(scoreComponent('hx-nonexistent')).rejects.toThrow(
          'Component hx-nonexistent not found in health history',
        );
      });

      it('should handle empty components array', async () => {
        mockFileOps.fileExists.mockReturnValue(true);
        mockReaddirSync.mockReturnValue(['2026-02-17.json']);
        mockFileOps.readJSON.mockReturnValue({
          timestamp: '2026-02-17T00:00:00Z',
          components: [],
        });

        await expect(scoreComponent('hx-button')).rejects.toThrow(
          'Component hx-button not found in health history',
        );
      });

      it('should handle missing score field with default value', async () => {
        mockFileOps.fileExists.mockReturnValue(true);
        mockReaddirSync.mockReturnValue(['2026-02-17.json']);
        mockFileOps.readJSON.mockReturnValue({
          timestamp: '2026-02-17T00:00:00Z',
          components: [{ tagName: 'hx-button', grade: 'A', dimensions: {}, issues: [] }],
        });

        const result = await scoreComponent('hx-button');
        expect(result.score).toBe(0);
      });

      it('should handle missing grade field with default value', async () => {
        mockFileOps.fileExists.mockReturnValue(true);
        mockReaddirSync.mockReturnValue(['2026-02-17.json']);
        mockFileOps.readJSON.mockReturnValue({
          timestamp: '2026-02-17T00:00:00Z',
          components: [{ tagName: 'hx-button', score: 95, dimensions: {}, issues: [] }],
        });

        const result = await scoreComponent('hx-button');
        expect(result.grade).toBe('F');
      });

      it('should handle missing dimensions field with default value', async () => {
        mockFileOps.fileExists.mockReturnValue(true);
        mockReaddirSync.mockReturnValue(['2026-02-17.json']);
        mockFileOps.readJSON.mockReturnValue({
          timestamp: '2026-02-17T00:00:00Z',
          components: [{ tagName: 'hx-button', score: 95, grade: 'A', issues: [] }],
        });

        const result = await scoreComponent('hx-button');
        expect(result.dimensions).toEqual({});
      });

      it('should handle missing issues field with default value', async () => {
        mockFileOps.fileExists.mockReturnValue(true);
        mockReaddirSync.mockReturnValue(['2026-02-17.json']);
        mockFileOps.readJSON.mockReturnValue({
          timestamp: '2026-02-17T00:00:00Z',
          components: [{ tagName: 'hx-button', score: 95, grade: 'A', dimensions: {} }],
        });

        const result = await scoreComponent('hx-button');
        expect(result.issues).toEqual([]);
      });
    });

    describe('scoreAllComponents', () => {
      it('should handle missing health history gracefully', async () => {
        mockFileOps.fileExists.mockReturnValue(false);

        await expect(scoreAllComponents()).rejects.toThrow(MCPError);
        await expect(scoreAllComponents()).rejects.toThrow(
          'No health history found. Run health scorer first.',
        );
      });

      it('should handle missing components field', async () => {
        mockFileOps.fileExists.mockReturnValue(true);
        mockReaddirSync.mockReturnValue(['2026-02-17.json']);
        mockFileOps.readJSON.mockReturnValue({
          timestamp: '2026-02-17T00:00:00Z',
        });

        await expect(scoreAllComponents()).rejects.toThrow(
          'No health history found. Run health scorer first.',
        );
      });

      it('should handle empty components array', async () => {
        mockFileOps.fileExists.mockReturnValue(true);
        mockReaddirSync.mockReturnValue(['2026-02-17.json']);
        mockFileOps.readJSON.mockReturnValue({
          timestamp: '2026-02-17T00:00:00Z',
          components: [],
        });

        const result = await scoreAllComponents();
        expect(result).toEqual([]);
      });
    });

    describe('getHealthTrend - CRITICAL: Division by Zero Protection', () => {
      it('should handle division by zero when firstScore is 0', async () => {
        mockFileOps.fileExists.mockReturnValue(true);
        mockReaddirSync.mockReturnValue(['2026-02-18.json', '2026-02-17.json']);

        let _callCount = 0;
        mockFileOps.readJSON.mockImplementation((path: string) => {
          _callCount++;
          if (path.includes('2026-02-17')) {
            return {
              timestamp: '2026-02-17T00:00:00Z',
              components: [{ tagName: 'hx-button', score: 0, grade: 'F' }],
            };
          }
          return {
            timestamp: '2026-02-18T00:00:00Z',
            components: [{ tagName: 'hx-button', score: 50, grade: 'C' }],
          };
        });

        const result = await getHealthTrend('hx-button', 2);

        // Should be 100% improvement, NOT Infinity
        expect(result.changePercent).toBe(100);
        expect(result.changePercent).not.toBe(Infinity);
        expect(result.trend).toBe('improving');
      });

      it('should handle both scores being 0', async () => {
        mockFileOps.fileExists.mockReturnValue(true);
        mockReaddirSync.mockReturnValue(['2026-02-18.json', '2026-02-17.json']);

        mockFileOps.readJSON.mockImplementation((path: string) => {
          return {
            timestamp: path.includes('2026-02-17')
              ? '2026-02-17T00:00:00Z'
              : '2026-02-18T00:00:00Z',
            components: [{ tagName: 'hx-button', score: 0, grade: 'F' }],
          };
        });

        const result = await getHealthTrend('hx-button', 2);

        // Should be 0% change, NOT Infinity or NaN
        expect(result.changePercent).toBe(0);
        expect(result.trend).toBe('stable');
      });

      it('should handle missing health history directory', async () => {
        mockFileOps.fileExists.mockReturnValue(false);

        await expect(getHealthTrend('hx-button')).rejects.toThrow(MCPError);
        await expect(getHealthTrend('hx-button')).rejects.toThrow(
          'Health history directory not found. Run health scorer first.',
        );
      });

      it('should handle empty health history directory', async () => {
        mockFileOps.fileExists.mockReturnValue(true);
        mockReaddirSync.mockReturnValue([]);

        await expect(getHealthTrend('hx-button')).rejects.toThrow('No health history files found');
      });

      it('should handle component not in any history files', async () => {
        mockFileOps.fileExists.mockReturnValue(true);
        mockReaddirSync.mockReturnValue(['2026-02-17.json', '2026-02-18.json']);
        mockFileOps.readJSON.mockReturnValue({
          timestamp: '2026-02-17T00:00:00Z',
          components: [{ tagName: 'hx-card', score: 85, grade: 'B' }],
        });

        await expect(getHealthTrend('hx-button', 7)).rejects.toThrow(
          'No history found for hx-button in the last 7 days',
        );
      });

      it('should handle trend calculation with 1 data point', async () => {
        mockFileOps.fileExists.mockReturnValue(true);
        mockReaddirSync.mockReturnValue(['2026-02-17.json']);
        mockFileOps.readJSON.mockReturnValue({
          timestamp: '2026-02-17T00:00:00Z',
          components: [{ tagName: 'hx-button', score: 75, grade: 'C' }],
        });

        const result = await getHealthTrend('hx-button', 7);

        // With 1 data point, change should be 0
        expect(result.dataPoints.length).toBe(1);
        expect(result.changePercent).toBe(0);
        expect(result.trend).toBe('stable');
      });

      it('should handle non-JSON files in history directory', async () => {
        mockFileOps.fileExists.mockReturnValue(true);
        mockReaddirSync.mockReturnValue([
          '2026-02-18.json',
          '.DS_Store',
          'README.md',
          '2026-02-17.json',
        ] as string[]);
        mockFileOps.readJSON.mockReturnValue({
          timestamp: '2026-02-17T00:00:00Z',
          components: [{ tagName: 'hx-button', score: 75, grade: 'C' }],
        });

        const result = await getHealthTrend('hx-button', 7);

        // Should only process .json files
        expect(result.dataPoints.length).toBe(2);
      });

      it('should respect days limit', async () => {
        mockFileOps.fileExists.mockReturnValue(true);
        mockReaddirSync.mockReturnValue([
          '2026-02-20.json',
          '2026-02-19.json',
          '2026-02-18.json',
          '2026-02-17.json',
          '2026-02-16.json',
        ] as string[]);
        mockFileOps.readJSON.mockReturnValue({
          timestamp: '2026-02-17T00:00:00Z',
          components: [{ tagName: 'hx-button', score: 75, grade: 'C' }],
        });

        const result = await getHealthTrend('hx-button', 3);

        // Should only use last 3 files
        expect(result.dataPoints.length).toBe(3);
      });
    });

    describe('getHealthDiff', () => {
      it('should handle component not existing in base branch', async () => {
        // Current branch has component
        mockFileOps.fileExists.mockReturnValue(true);
        mockReaddirSync.mockReturnValue(['2026-02-17.json']);

        let callCount = 0;
        mockFileOps.readJSON.mockImplementation(() => {
          callCount++;
          if (callCount === 1 || callCount === 3) {
            // First and third calls: current branch (has component)
            return {
              timestamp: '2026-02-17T00:00:00Z',
              components: [{ tagName: 'hx-button', score: 85, grade: 'B', dimensions: {} }],
            };
          } else {
            // Second and fourth calls: base branch (no component)
            return {
              timestamp: '2026-02-17T00:00:00Z',
              components: [],
            };
          }
        });

        const result = await getHealthDiff('hx-button', 'main');

        // Should show improvement from 0
        expect(result.base.score).toBe(0);
        expect(result.base.grade).toBe('F');
        expect(result.base.issues).toContain('Component not found in base branch');
        expect(result.current.score).toBe(85);
        expect(result.improved).toBe(true);
        expect(result.scoreDelta).toBe(85);
      });

      it('should handle component score regression', async () => {
        mockFileOps.fileExists.mockReturnValue(true);
        mockReaddirSync.mockReturnValue(['2026-02-17.json']);

        let callCount = 0;
        mockFileOps.readJSON.mockImplementation(() => {
          callCount++;
          if (callCount === 1 || callCount === 3) {
            // Current branch: lower score
            return {
              timestamp: '2026-02-17T00:00:00Z',
              components: [{ tagName: 'hx-button', score: 60, grade: 'D', dimensions: {} }],
            };
          } else {
            // Base branch: higher score
            return {
              timestamp: '2026-02-17T00:00:00Z',
              components: [{ tagName: 'hx-button', score: 85, grade: 'B', dimensions: {} }],
            };
          }
        });

        const result = await getHealthDiff('hx-button', 'main');

        expect(result.regressed).toBe(true);
        expect(result.improved).toBe(false);
        expect(result.scoreDelta).toBe(-25);
      });

      it('should handle no change in score', async () => {
        mockFileOps.fileExists.mockReturnValue(true);
        mockReaddirSync.mockReturnValue(['2026-02-17.json']);
        mockFileOps.readJSON.mockReturnValue({
          timestamp: '2026-02-17T00:00:00Z',
          components: [{ tagName: 'hx-button', score: 85, grade: 'B', dimensions: {} }],
        });

        const result = await getHealthDiff('hx-button', 'main');

        expect(result.improved).toBe(false);
        expect(result.regressed).toBe(false);
        expect(result.scoreDelta).toBe(0);
      });

      it('should detect dimension changes', async () => {
        mockFileOps.fileExists.mockReturnValue(true);
        mockReaddirSync.mockReturnValue(['2026-02-17.json']);

        let callCount = 0;
        mockFileOps.readJSON.mockImplementation(() => {
          callCount++;
          if (callCount === 1 || callCount === 3) {
            // Current branch
            return {
              timestamp: '2026-02-17T00:00:00Z',
              components: [
                {
                  tagName: 'hx-button',
                  score: 85,
                  grade: 'B',
                  dimensions: { accessibility: 90, performance: 80 },
                },
              ],
            };
          } else {
            // Base branch
            return {
              timestamp: '2026-02-17T00:00:00Z',
              components: [
                {
                  tagName: 'hx-button',
                  score: 85,
                  grade: 'B',
                  dimensions: { accessibility: 75, performance: 80, documentation: 100 },
                },
              ],
            };
          }
        });

        const result = await getHealthDiff('hx-button', 'main');

        expect(result.changedDimensions.length).toBe(2);
        const accessibilityChange = result.changedDimensions.find(
          (d) => d.dimension === 'accessibility',
        );
        expect(accessibilityChange?.delta).toBe(15);

        const documentationChange = result.changedDimensions.find(
          (d) => d.dimension === 'documentation',
        );
        expect(documentationChange?.delta).toBe(-100);
      });

      it('should round score delta to 1 decimal place', async () => {
        mockFileOps.fileExists.mockReturnValue(true);
        mockReaddirSync.mockReturnValue(['2026-02-17.json']);

        let callCount = 0;
        mockFileOps.readJSON.mockImplementation(() => {
          callCount++;
          return {
            timestamp: '2026-02-17T00:00:00Z',
            components: [
              {
                tagName: 'hx-button',
                score: callCount === 1 || callCount === 3 ? 85.666 : 80.123,
                grade: 'B',
                dimensions: {},
              },
            ],
          };
        });

        const result = await getHealthDiff('hx-button', 'main');

        // 85.666 - 80.123 = 5.543 -> 5.5
        expect(result.scoreDelta).toBe(5.5);
      });
    });
  });

  // =====================================================
  // VALID: Happy Paths
  // =====================================================
  describe('VALID: Happy Paths', () => {
    describe('scoreComponent', () => {
      it('should return valid health data for real component', async () => {
        mockFileOps.fileExists.mockReturnValue(true);
        mockReaddirSync.mockReturnValue(['2026-02-17.json']);
        mockFileOps.readJSON.mockReturnValue({
          timestamp: '2026-02-17T12:34:56Z',
          components: [
            {
              tagName: 'hx-button',
              score: 95,
              grade: 'A',
              dimensions: {
                accessibility: 100,
                performance: 90,
                documentation: 95,
              },
              issues: [],
            },
          ],
        });

        const result = await scoreComponent('hx-button');

        expect(result.tagName).toBe('hx-button');
        expect(result.score).toBe(95);
        expect(result.grade).toBe('A');
        expect(result.dimensions).toEqual({
          accessibility: 100,
          performance: 90,
          documentation: 95,
        });
        expect(result.issues).toEqual([]);
        expect(result.timestamp).toBe('2026-02-17T12:34:56Z');
      });

      it('should return component with issues', async () => {
        mockFileOps.fileExists.mockReturnValue(true);
        mockReaddirSync.mockReturnValue(['2026-02-17.json']);
        mockFileOps.readJSON.mockReturnValue({
          timestamp: '2026-02-17T12:34:56Z',
          components: [
            {
              tagName: 'hx-card',
              score: 60,
              grade: 'D',
              dimensions: { accessibility: 50 },
              issues: ['Missing ARIA labels', 'No keyboard navigation'],
            },
          ],
        });

        const result = await scoreComponent('hx-card');

        expect(result.tagName).toBe('hx-card');
        expect(result.score).toBe(60);
        expect(result.grade).toBe('D');
        expect(result.issues).toEqual(['Missing ARIA labels', 'No keyboard navigation']);
      });
    });

    describe('scoreAllComponents', () => {
      it('should return all components', async () => {
        mockFileOps.fileExists.mockReturnValue(true);
        mockReaddirSync.mockReturnValue(['2026-02-17.json']);
        mockFileOps.readJSON.mockReturnValue({
          timestamp: '2026-02-17T12:34:56Z',
          components: [
            {
              tagName: 'hx-button',
              score: 95,
              grade: 'A',
              dimensions: {},
              issues: [],
            },
            {
              tagName: 'hx-card',
              score: 85,
              grade: 'B',
              dimensions: {},
              issues: [],
            },
            {
              tagName: 'hx-text-input',
              score: 75,
              grade: 'C',
              dimensions: {},
              issues: ['No error message support'],
            },
          ],
        });

        const result = await scoreAllComponents();

        expect(result.length).toBe(3);
        expect(result[0]?.tagName).toBe('hx-button');
        expect(result[1]?.tagName).toBe('hx-card');
        expect(result[2]?.tagName).toBe('hx-text-input');
      });
    });

    describe('getHealthTrend', () => {
      it('should calculate improving trend', async () => {
        mockFileOps.fileExists.mockReturnValue(true);
        mockReaddirSync.mockReturnValue(['2026-02-18.json', '2026-02-17.json']);

        let _callCount = 0;
        mockFileOps.readJSON.mockImplementation((path: string) => {
          _callCount++;
          if (path.includes('2026-02-17')) {
            return {
              timestamp: '2026-02-17T00:00:00Z',
              components: [{ tagName: 'hx-button', score: 70, grade: 'C' }],
            };
          }
          return {
            timestamp: '2026-02-18T00:00:00Z',
            components: [{ tagName: 'hx-button', score: 90, grade: 'A' }],
          };
        });

        const result = await getHealthTrend('hx-button', 2);

        expect(result.tagName).toBe('hx-button');
        expect(result.days).toBe(2);
        expect(result.trend).toBe('improving');
        expect(result.changePercent).toBeGreaterThan(5);
        expect(result.dataPoints[0]?.date).toBe('2026-02-17');
        expect(result.dataPoints[1]?.date).toBe('2026-02-18');
      });

      it('should calculate declining trend', async () => {
        mockFileOps.fileExists.mockReturnValue(true);
        mockReaddirSync.mockReturnValue(['2026-02-18.json', '2026-02-17.json']);

        let _callCount = 0;
        mockFileOps.readJSON.mockImplementation((path: string) => {
          _callCount++;
          if (path.includes('2026-02-17')) {
            return {
              timestamp: '2026-02-17T00:00:00Z',
              components: [{ tagName: 'hx-button', score: 90, grade: 'A' }],
            };
          }
          return {
            timestamp: '2026-02-18T00:00:00Z',
            components: [{ tagName: 'hx-button', score: 70, grade: 'C' }],
          };
        });

        const result = await getHealthTrend('hx-button', 2);

        expect(result.trend).toBe('declining');
        expect(result.changePercent).toBeLessThan(-5);
      });

      it('should calculate stable trend', async () => {
        mockFileOps.fileExists.mockReturnValue(true);
        mockReaddirSync.mockReturnValue(['2026-02-18.json', '2026-02-17.json']);

        mockFileOps.readJSON.mockReturnValue({
          timestamp: '2026-02-17T00:00:00Z',
          components: [{ tagName: 'hx-button', score: 85, grade: 'B' }],
        });

        const result = await getHealthTrend('hx-button', 2);

        expect(result.trend).toBe('stable');
        expect(result.changePercent).toBe(0);
      });
    });

    describe('getHealthDiff', () => {
      it('should calculate diff with improvements', async () => {
        mockFileOps.fileExists.mockReturnValue(true);
        mockReaddirSync.mockReturnValue(['2026-02-17.json']);

        let callCount = 0;
        mockFileOps.readJSON.mockImplementation(() => {
          callCount++;
          if (callCount === 1 || callCount === 3) {
            return {
              timestamp: '2026-02-17T00:00:00Z',
              components: [
                {
                  tagName: 'hx-button',
                  score: 90,
                  grade: 'A',
                  dimensions: { accessibility: 95 },
                },
              ],
            };
          }
          return {
            timestamp: '2026-02-17T00:00:00Z',
            components: [
              {
                tagName: 'hx-button',
                score: 75,
                grade: 'C',
                dimensions: { accessibility: 70 },
              },
            ],
          };
        });

        const result = await getHealthDiff('hx-button', 'main');

        expect(result.improved).toBe(true);
        expect(result.scoreDelta).toBe(15);
        expect(result.changedDimensions[0]?.dimension).toBe('accessibility');
        expect(result.changedDimensions[0]?.delta).toBe(25);
      });
    });
  });

  // =====================================================
  // Error Handling
  // =====================================================
  describe('Error Handling', () => {
    it('should categorize missing health history as UserInput', async () => {
      mockFileOps.fileExists.mockReturnValue(false);

      try {
        await scoreComponent('hx-button');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(MCPError);
        expect((error as MCPError).category).toBe(ErrorCategory.UserInput);
      }
    });

    it('should categorize missing component as UserInput', async () => {
      mockFileOps.fileExists.mockReturnValue(true);
      mockReaddirSync.mockReturnValue(['2026-02-17.json']);
      mockFileOps.readJSON.mockReturnValue({
        timestamp: '2026-02-17T00:00:00Z',
        components: [],
      });

      try {
        await scoreComponent('hx-nonexistent');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(MCPError);
        expect((error as MCPError).category).toBe(ErrorCategory.UserInput);
      }
    });

    it('should provide helpful error messages', async () => {
      mockFileOps.fileExists.mockReturnValue(true);
      mockReaddirSync.mockReturnValue(['2026-02-17.json']);
      mockFileOps.readJSON.mockReturnValue({
        timestamp: '2026-02-17T00:00:00Z',
        components: [{ tagName: 'hx-card', score: 85, grade: 'B' }],
      });

      try {
        await scoreComponent('hx-button');
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).toContain('hx-button');
        expect((error as Error).message).toContain('not found');
      }
    });
  });
});
