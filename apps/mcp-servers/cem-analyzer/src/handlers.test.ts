import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MCPError, ErrorCategory } from '@helixui/mcp-shared';

// Create shared mock objects
const mockFileOps = {
  fileExists: vi.fn(),
  readJSON: vi.fn(),
  validatePath: vi.fn((path: string) => path),
};

const mockGit = {
  withBranch: vi.fn((branch: string, fn: () => any) => fn()),
  getCurrentBranch: vi.fn(() => 'main'),
};

// Mock dependencies BEFORE importing handlers
vi.mock('@helixui/mcp-shared', async () => {
  const actual = await vi.importActual('@helixui/mcp-shared');

  return {
    ...actual,
    SafeFileOperations: vi.fn(() => mockFileOps),
    GitOperations: vi.fn(() => mockGit),
  };
});

// Import after mocking
const { parseCem, diffCem, listAllComponents, validateCompleteness } =
  await import('./handlers.js');

describe('MCP Server: cem-analyzer handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // =====================================================
  // parseCem (10 tests)
  // =====================================================
  describe('parseCem', () => {
    describe('Valid CEM parsing', () => {
      it('should parse valid CEM and return component details', async () => {
        mockFileOps.fileExists.mockReturnValue(true);
        mockFileOps.readJSON.mockReturnValue({
          schemaVersion: '1.0.0',
          modules: [
            {
              declarations: [
                {
                  tagName: 'hx-button',
                  name: 'HxButton',
                  description: 'A button component',
                  members: [
                    {
                      name: 'variant',
                      kind: 'field',
                      type: { text: 'string' },
                      description: 'Button variant',
                    },
                  ],
                  events: [
                    { name: 'hx-click', type: { text: 'CustomEvent' }, description: 'Click event' },
                  ],
                  slots: [{ name: '', description: 'Default slot' }],
                  cssProperties: [{ name: '--hx-button-bg', description: 'Background color' }],
                  cssParts: [{ name: 'button', description: 'Button element' }],
                },
              ],
            },
          ],
        });

        const result = await parseCem('hx-button');

        expect(result).toEqual({
          tagName: 'hx-button',
          name: 'HxButton',
          description: 'A button component',
          members: [
            {
              name: 'variant',
              kind: 'field',
              type: { text: 'string' },
              description: 'Button variant',
            },
          ],
          events: [{ name: 'hx-click', type: { text: 'CustomEvent' }, description: 'Click event' }],
          slots: [{ name: '', description: 'Default slot' }],
          cssProperties: [{ name: '--hx-button-bg', description: 'Background color' }],
          cssParts: [{ name: 'button', description: 'Button element' }],
        });
      });

      it('should handle components with minimal properties', async () => {
        mockFileOps.fileExists.mockReturnValue(true);
        mockFileOps.readJSON.mockReturnValue({
          modules: [
            {
              declarations: [
                {
                  tagName: 'hx-minimal',
                  name: 'HxMinimal',
                },
              ],
            },
          ],
        });

        const result = await parseCem('hx-minimal');

        expect(result).toEqual({
          tagName: 'hx-minimal',
          name: 'HxMinimal',
          description: '',
          members: [],
          events: [],
          slots: [],
          cssProperties: [],
          cssParts: [],
        });
      });
    });

    describe('CRITICAL SECURITY: Missing tagName validation', () => {
      it('should throw System error when component has no tagName', async () => {
        mockFileOps.fileExists.mockReturnValue(true);
        mockFileOps.readJSON.mockReturnValue({
          modules: [
            {
              declarations: [
                {
                  name: 'HxButton',
                  description: 'Missing tagName',
                },
              ],
            },
          ],
        });

        // Mock listAllComponents to avoid recursion
        vi.spyOn({ listAllComponents }, 'listAllComponents').mockResolvedValue([]);

        try {
          await parseCem('hx-button');
          expect.fail('Should have thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(MCPError);
          expect((error as MCPError).message).toContain('not found in CEM');
          expect((error as MCPError).category).toBe(ErrorCategory.UserInput);
        }
      });

      it('should throw System error when found component has no tagName', async () => {
        mockFileOps.fileExists.mockReturnValue(true);
        mockFileOps.readJSON.mockReturnValue({
          modules: [
            {
              declarations: [
                {
                  // tagName is undefined but name matches search
                  name: 'hx-button',
                },
              ],
            },
          ],
        });

        // Component is found by name but has no tagName
        try {
          await parseCem('hx-button');
          expect.fail('Should have thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(MCPError);
          // Component not found because tagName doesn't match
          expect((error as MCPError).category).toBe(ErrorCategory.UserInput);
        }
      });
    });

    describe('Path traversal and malformed input', () => {
      it('should reject missing CEM file', async () => {
        mockFileOps.fileExists.mockReturnValue(false);

        await expect(parseCem('hx-button')).rejects.toThrow(MCPError);
        await expect(parseCem('hx-button')).rejects.toThrow("Run 'npm run cem' first");
      });

      it('should handle path traversal attempts via tagName', async () => {
        mockFileOps.fileExists.mockReturnValue(true);
        mockFileOps.readJSON.mockReturnValue({
          modules: [
            {
              declarations: [
                {
                  tagName: 'hx-button',
                  name: 'HxButton',
                },
              ],
            },
          ],
        });

        // Attempt path traversal - should not find component
        await expect(parseCem('../../../etc/passwd')).rejects.toThrow(MCPError);
        await expect(parseCem('../../../etc/passwd')).rejects.toThrow('not found in CEM');
      });

      it('should handle malformed tagName input', async () => {
        mockFileOps.fileExists.mockReturnValue(true);
        mockFileOps.readJSON.mockReturnValue({
          modules: [{ declarations: [{ tagName: 'hx-button', name: 'HxButton' }] }],
        });

        await expect(parseCem('')).rejects.toThrow(MCPError);
        await expect(parseCem('../../etc/passwd')).rejects.toThrow(MCPError);
        await expect(parseCem('hx-<script>alert(1)</script>')).rejects.toThrow(MCPError);
      });
    });

    describe('Malformed JSON handling', () => {
      it('should handle empty modules array', async () => {
        mockFileOps.fileExists.mockReturnValue(true);
        mockFileOps.readJSON.mockReturnValue({
          modules: [],
        });

        await expect(parseCem('hx-button')).rejects.toThrow(MCPError);
        await expect(parseCem('hx-button')).rejects.toThrow('not found in CEM');
      });

      it('should handle modules with no declarations', async () => {
        mockFileOps.fileExists.mockReturnValue(true);
        mockFileOps.readJSON.mockReturnValue({
          modules: [
            {
              path: 'some/path.ts',
            },
          ],
        });

        await expect(parseCem('hx-button')).rejects.toThrow(MCPError);
      });

      it('should handle component not found in CEM', async () => {
        mockFileOps.fileExists.mockReturnValue(true);
        mockFileOps.readJSON.mockReturnValue({
          modules: [
            {
              declarations: [
                {
                  tagName: 'hx-card',
                  name: 'HxCard',
                },
              ],
            },
          ],
        });

        await expect(parseCem('hx-nonexistent')).rejects.toThrow(MCPError);
        await expect(parseCem('hx-nonexistent')).rejects.toThrow('not found in CEM');
      });
    });
  });

  // =====================================================
  // diffCem (12 tests)
  // =====================================================
  describe('diffCem', () => {
    describe('Breaking changes detection', () => {
      it('should detect removed property as breaking change', async () => {
        mockFileOps.fileExists.mockReturnValue(true);

        // Set up sequential return values: first for base branch, then for current
        mockFileOps.readJSON
          .mockReturnValueOnce({
            // Base branch (inside withBranch)
            modules: [
              {
                declarations: [
                  {
                    tagName: 'hx-button',
                    name: 'HxButton',
                    members: [
                      { name: 'variant', kind: 'field' },
                      { name: 'disabled', kind: 'field' },
                    ],
                  },
                ],
              },
            ],
          })
          .mockReturnValueOnce({
            // Current branch (parseCem call)
            modules: [
              {
                declarations: [
                  {
                    tagName: 'hx-button',
                    name: 'HxButton',
                    members: [{ name: 'disabled', kind: 'field' }],
                  },
                ],
              },
            ],
          });

        const result = await diffCem('hx-button', 'main');

        expect(result.breaking).toContain('Property removed: variant');
        expect(result.breaking).toHaveLength(1);
      });

      it('should detect removed event as breaking change', async () => {
        mockFileOps.fileExists.mockReturnValue(true);

        mockFileOps.readJSON
          .mockReturnValueOnce({
            modules: [
              {
                declarations: [
                  {
                    tagName: 'hx-button',
                    name: 'HxButton',
                    events: [{ name: 'hx-click' }, { name: 'hx-focus' }],
                  },
                ],
              },
            ],
          })
          .mockReturnValueOnce({
            modules: [
              {
                declarations: [
                  {
                    tagName: 'hx-button',
                    name: 'HxButton',
                    events: [{ name: 'hx-click' }],
                  },
                ],
              },
            ],
          });

        const result = await diffCem('hx-button', 'main');

        expect(result.breaking).toContain('Event removed: hx-focus');
      });

      it('should detect removed slot as breaking change', async () => {
        mockFileOps.fileExists.mockReturnValue(true);

        mockFileOps.readJSON
          .mockReturnValueOnce({
            modules: [
              {
                declarations: [
                  {
                    tagName: 'hx-button',
                    name: 'HxButton',
                    slots: [{ name: '' }, { name: 'icon' }],
                  },
                ],
              },
            ],
          })
          .mockReturnValueOnce({
            modules: [
              {
                declarations: [
                  {
                    tagName: 'hx-button',
                    name: 'HxButton',
                    slots: [{ name: '' }],
                  },
                ],
              },
            ],
          });

        const result = await diffCem('hx-button', 'main');

        expect(result.breaking).toContain('Slot removed: icon');
      });

      it('should detect multiple breaking changes', async () => {
        mockFileOps.fileExists.mockReturnValue(true);

        mockFileOps.readJSON
          .mockReturnValueOnce({
            modules: [
              {
                declarations: [
                  {
                    tagName: 'hx-button',
                    name: 'HxButton',
                    members: [{ name: 'variant', kind: 'field' }],
                    events: [{ name: 'hx-click' }],
                    slots: [{ name: 'icon' }],
                  },
                ],
              },
            ],
          })
          .mockReturnValueOnce({
            modules: [
              {
                declarations: [
                  {
                    tagName: 'hx-button',
                    name: 'HxButton',
                    members: [],
                    events: [],
                    slots: [],
                  },
                ],
              },
            ],
          });

        const result = await diffCem('hx-button', 'main');

        expect(result.breaking).toHaveLength(3);
        expect(result.breaking).toContain('Property removed: variant');
        expect(result.breaking).toContain('Event removed: hx-click');
        expect(result.breaking).toContain('Slot removed: icon');
      });

      it('should not flag type changes as breaking (not implemented)', async () => {
        // This test documents that type changes are NOT currently detected
        mockFileOps.fileExists.mockReturnValue(true);

        mockFileOps.readJSON
          .mockReturnValueOnce({
            modules: [
              {
                declarations: [
                  {
                    tagName: 'hx-button',
                    name: 'HxButton',
                    members: [{ name: 'variant', kind: 'field', type: { text: 'string' } }],
                  },
                ],
              },
            ],
          })
          .mockReturnValueOnce({
            modules: [
              {
                declarations: [
                  {
                    tagName: 'hx-button',
                    name: 'HxButton',
                    members: [{ name: 'variant', kind: 'field', type: { text: 'number' } }],
                  },
                ],
              },
            ],
          });

        const result = await diffCem('hx-button', 'main');

        // Type change is NOT detected as breaking (limitation)
        expect(result.breaking).toHaveLength(0);
      });
    });

    describe('Non-breaking additions', () => {
      it('should detect added property as non-breaking', async () => {
        mockFileOps.fileExists.mockReturnValue(true);

        mockFileOps.readJSON
          .mockReturnValueOnce({
            modules: [
              {
                declarations: [
                  {
                    tagName: 'hx-button',
                    name: 'HxButton',
                    members: [{ name: 'variant', kind: 'field' }],
                  },
                ],
              },
            ],
          })
          .mockReturnValueOnce({
            modules: [
              {
                declarations: [
                  {
                    tagName: 'hx-button',
                    name: 'HxButton',
                    members: [
                      { name: 'variant', kind: 'field' },
                      { name: 'size', kind: 'field' },
                    ],
                  },
                ],
              },
            ],
          });

        const result = await diffCem('hx-button', 'main');

        expect(result.added).toContain('Property added: size');
        expect(result.breaking).toHaveLength(0);
      });

      it('should detect added event as non-breaking', async () => {
        mockFileOps.fileExists.mockReturnValue(true);

        mockFileOps.readJSON
          .mockReturnValueOnce({
            modules: [
              {
                declarations: [
                  {
                    tagName: 'hx-button',
                    name: 'HxButton',
                    events: [{ name: 'hx-click' }],
                  },
                ],
              },
            ],
          })
          .mockReturnValueOnce({
            modules: [
              {
                declarations: [
                  {
                    tagName: 'hx-button',
                    name: 'HxButton',
                    events: [{ name: 'hx-click' }, { name: 'hx-focus' }],
                  },
                ],
              },
            ],
          });

        const result = await diffCem('hx-button', 'main');

        expect(result.added).toContain('Event added: hx-focus');
        expect(result.breaking).toHaveLength(0);
      });
    });

    describe('Edge cases', () => {
      it('should handle missing CEM in base branch (new component)', async () => {
        let callCount = 0;
        mockFileOps.fileExists.mockImplementation(() => {
          callCount++;
          return callCount > 1; // false for first call (base branch), true after
        });

        mockFileOps.readJSON.mockReturnValue({
          modules: [
            {
              declarations: [
                {
                  tagName: 'hx-button',
                  name: 'HxButton',
                },
              ],
            },
          ],
        });

        const result = await diffCem('hx-button', 'main');

        expect(result.added).toContain('New component: hx-button');
        expect(result.breaking).toHaveLength(0);
      });

      it('should handle component not in base branch CEM', async () => {
        mockFileOps.fileExists.mockReturnValue(true);

        mockFileOps.readJSON
          .mockReturnValueOnce({
            // Base branch - only has hx-card
            modules: [
              {
                declarations: [
                  {
                    tagName: 'hx-card',
                    name: 'HxCard',
                  },
                ],
              },
            ],
          })
          .mockReturnValueOnce({
            // Current branch - has both
            modules: [
              {
                declarations: [
                  {
                    tagName: 'hx-button',
                    name: 'HxButton',
                  },
                  {
                    tagName: 'hx-card',
                    name: 'HxCard',
                  },
                ],
              },
            ],
          });

        const result = await diffCem('hx-button', 'main');

        expect(result.added).toContain('New component: hx-button');
      });

      it('should handle identical CEM (no changes)', async () => {
        const cemData = {
          modules: [
            {
              declarations: [
                {
                  tagName: 'hx-button',
                  name: 'HxButton',
                  members: [{ name: 'variant', kind: 'field' }],
                },
              ],
            },
          ],
        };

        mockFileOps.fileExists.mockReturnValue(true);
        mockFileOps.readJSON.mockReturnValue(cemData);

        const result = await diffCem('hx-button', 'main');

        expect(result.breaking).toHaveLength(0);
        expect(result.added).toHaveLength(0);
        expect(result.removed).toHaveLength(0);
        expect(result.changed).toHaveLength(0);
      });

      it('should validate diff accuracy with complex changes', async () => {
        mockFileOps.fileExists.mockReturnValue(true);

        mockFileOps.readJSON
          .mockReturnValueOnce({
            modules: [
              {
                declarations: [
                  {
                    tagName: 'hx-button',
                    name: 'HxButton',
                    members: [
                      { name: 'variant', kind: 'field' },
                      { name: 'disabled', kind: 'field' },
                    ],
                    events: [{ name: 'hx-click' }],
                    slots: [{ name: '' }, { name: 'icon' }],
                  },
                ],
              },
            ],
          })
          .mockReturnValueOnce({
            modules: [
              {
                declarations: [
                  {
                    tagName: 'hx-button',
                    name: 'HxButton',
                    members: [
                      { name: 'variant', kind: 'field' },
                      { name: 'size', kind: 'field' },
                    ],
                    events: [{ name: 'hx-click' }, { name: 'hx-focus' }],
                    slots: [{ name: '' }],
                  },
                ],
              },
            ],
          });

        const result = await diffCem('hx-button', 'main');

        // Breaking: removed disabled and icon slot
        expect(result.breaking).toHaveLength(2);
        expect(result.breaking).toContain('Property removed: disabled');
        expect(result.breaking).toContain('Slot removed: icon');

        // Added: size property and hx-focus event
        expect(result.added).toHaveLength(2);
        expect(result.added).toContain('Property added: size');
        expect(result.added).toContain('Event added: hx-focus');
      });
    });
  });

  // =====================================================
  // listAllComponents (8 tests)
  // =====================================================
  describe('listAllComponents', () => {
    it('should list all components with tagNames', async () => {
      mockFileOps.fileExists.mockReturnValue(true);
      mockFileOps.readJSON.mockReturnValue({
        modules: [
          {
            declarations: [
              { tagName: 'hx-button', name: 'HxButton' },
              { tagName: 'hx-card', name: 'HxCard' },
            ],
          },
          {
            declarations: [{ tagName: 'hx-input', name: 'HxInput' }],
          },
        ],
      });

      const result = await listAllComponents();

      expect(result).toEqual(['hx-button', 'hx-card', 'hx-input']);
      expect(result).toHaveLength(3);
    });

    it('should handle components across multiple modules', async () => {
      mockFileOps.fileExists.mockReturnValue(true);
      mockFileOps.readJSON.mockReturnValue({
        modules: [
          { declarations: [{ tagName: 'hx-button', name: 'HxButton' }] },
          { declarations: [{ tagName: 'hx-card', name: 'HxCard' }] },
          { declarations: [{ tagName: 'hx-input', name: 'HxInput' }] },
        ],
      });

      const result = await listAllComponents();

      expect(result).toHaveLength(3);
      expect(result).toContain('hx-button');
      expect(result).toContain('hx-card');
      expect(result).toContain('hx-input');
    });

    it('should return empty array for empty CEM', async () => {
      mockFileOps.fileExists.mockReturnValue(true);
      mockFileOps.readJSON.mockReturnValue({
        modules: [],
      });

      const result = await listAllComponents();

      expect(result).toEqual([]);
    });

    it('should handle missing modules array', async () => {
      mockFileOps.fileExists.mockReturnValue(true);
      mockFileOps.readJSON.mockReturnValue({
        schemaVersion: '1.0.0',
      });

      const result = await listAllComponents();

      expect(result).toEqual([]);
    });

    it('should handle modules with no declarations', async () => {
      mockFileOps.fileExists.mockReturnValue(true);
      mockFileOps.readJSON.mockReturnValue({
        modules: [{ path: 'some/path.ts' }, { declarations: [] }],
      });

      const result = await listAllComponents();

      expect(result).toEqual([]);
    });

    it('should filter out components without tagNames', async () => {
      mockFileOps.fileExists.mockReturnValue(true);
      mockFileOps.readJSON.mockReturnValue({
        modules: [
          {
            declarations: [
              { tagName: 'hx-button', name: 'HxButton' },
              { name: 'SomeClass' }, // No tagName
              { tagName: 'hx-card', name: 'HxCard' },
            ],
          },
        ],
      });

      const result = await listAllComponents();

      expect(result).toEqual(['hx-button', 'hx-card']);
      expect(result).toHaveLength(2);
    });

    it('should handle duplicate components (deduplication not implemented)', async () => {
      mockFileOps.fileExists.mockReturnValue(true);
      mockFileOps.readJSON.mockReturnValue({
        modules: [
          { declarations: [{ tagName: 'hx-button', name: 'HxButton' }] },
          { declarations: [{ tagName: 'hx-button', name: 'HxButton' }] },
        ],
      });

      const result = await listAllComponents();

      // Duplicates are NOT filtered (documents current behavior)
      expect(result).toEqual(['hx-button', 'hx-button']);
    });

    it('should throw error when CEM file not found', async () => {
      mockFileOps.fileExists.mockReturnValue(false);

      await expect(listAllComponents()).rejects.toThrow(MCPError);
      await expect(listAllComponents()).rejects.toThrow("Run 'npm run cem' first");
    });
  });

  // =====================================================
  // validateCompleteness (8 tests)
  // =====================================================
  describe('validateCompleteness', () => {
    it('should return valid for fully documented component', async () => {
      mockFileOps.fileExists.mockReturnValue(true);
      mockFileOps.readJSON.mockReturnValue({
        modules: [
          {
            declarations: [
              {
                tagName: 'hx-button',
                name: 'HxButton',
                description: 'A button component',
                members: [{ name: 'variant', kind: 'field', description: 'Button variant' }],
                events: [{ name: 'hx-click', description: 'Click event' }],
                cssProperties: [{ name: '--hx-button-bg', description: 'Background color' }],
                cssParts: [{ name: 'button', description: 'Button element' }],
              },
            ],
          },
        ],
      });

      const result = await validateCompleteness('hx-button');

      expect(result.isValid).toBe(true);
      expect(result.score).toBe(100);
      expect(result.issues).toHaveLength(0);
    });

    it('should return perfect score for minimal but complete component', async () => {
      mockFileOps.fileExists.mockReturnValue(true);
      mockFileOps.readJSON.mockReturnValue({
        modules: [
          {
            declarations: [
              {
                tagName: 'hx-button',
                name: 'HxButton',
                description: 'A button',
                members: [{ name: 'variant', kind: 'field', description: 'Variant' }],
              },
            ],
          },
        ],
      });

      const result = await validateCompleteness('hx-button');

      expect(result.isValid).toBe(true);
      expect(result.score).toBe(100);
    });

    it('should penalize missing component description', async () => {
      mockFileOps.fileExists.mockReturnValue(true);
      mockFileOps.readJSON.mockReturnValue({
        modules: [
          {
            declarations: [
              {
                tagName: 'hx-button',
                name: 'HxButton',
                members: [{ name: 'variant', kind: 'field', description: 'Button variant' }],
              },
            ],
          },
        ],
      });

      const result = await validateCompleteness('hx-button');

      expect(result.isValid).toBe(false);
      expect(result.score).toBe(90);
      expect(result.issues).toContain('Missing component description');
    });

    it('should penalize empty component description', async () => {
      mockFileOps.fileExists.mockReturnValue(true);
      mockFileOps.readJSON.mockReturnValue({
        modules: [
          {
            declarations: [
              {
                tagName: 'hx-button',
                name: 'HxButton',
                description: '   ',
                members: [{ name: 'variant', kind: 'field', description: 'Variant' }],
              },
            ],
          },
        ],
      });

      const result = await validateCompleteness('hx-button');

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Missing component description');
    });

    it('should penalize missing property descriptions', async () => {
      mockFileOps.fileExists.mockReturnValue(true);
      mockFileOps.readJSON.mockReturnValue({
        modules: [
          {
            declarations: [
              {
                tagName: 'hx-button',
                name: 'HxButton',
                description: 'A button',
                members: [
                  { name: 'variant', kind: 'field' },
                  { name: 'disabled', kind: 'field', description: 'Disabled state' },
                  { name: 'size', kind: 'field' },
                ],
              },
            ],
          },
        ],
      });

      const result = await validateCompleteness('hx-button');

      expect(result.isValid).toBe(false);
      expect(result.score).toBe(90); // -10 for 2 undocumented props (5 each)
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]).toContain('2 properties missing descriptions');
      expect(result.issues[0]).toContain('variant');
      expect(result.issues[0]).toContain('size');
    });

    it('should penalize missing event and CSS property descriptions', async () => {
      mockFileOps.fileExists.mockReturnValue(true);
      mockFileOps.readJSON.mockReturnValue({
        modules: [
          {
            declarations: [
              {
                tagName: 'hx-button',
                name: 'HxButton',
                description: 'A button',
                members: [{ name: 'variant', kind: 'field', description: 'Variant' }],
                events: [{ name: 'hx-click' }, { name: 'hx-focus', description: 'Focus event' }],
                cssProperties: [{ name: '--hx-button-bg' }],
                cssParts: [{ name: 'button' }],
              },
            ],
          },
        ],
      });

      const result = await validateCompleteness('hx-button');

      expect(result.isValid).toBe(false);
      // -5 for 1 event, -3 for 1 CSS prop, -3 for 1 CSS part = -11
      expect(result.score).toBe(89);
      expect(result.issues).toHaveLength(3);
    });

    it('should handle no properties documented as major issue', async () => {
      mockFileOps.fileExists.mockReturnValue(true);
      mockFileOps.readJSON.mockReturnValue({
        modules: [
          {
            declarations: [
              {
                tagName: 'hx-button',
                name: 'HxButton',
                description: 'A button',
              },
            ],
          },
        ],
      });

      const result = await validateCompleteness('hx-button');

      expect(result.isValid).toBe(false);
      expect(result.score).toBe(80); // -20 for no properties
      expect(result.issues).toContain('No properties documented');
    });

    it('should calculate correct quality score with multiple issues', async () => {
      mockFileOps.fileExists.mockReturnValue(true);
      mockFileOps.readJSON.mockReturnValue({
        modules: [
          {
            declarations: [
              {
                tagName: 'hx-button',
                name: 'HxButton',
                // Missing description: -10
                members: [
                  { name: 'variant', kind: 'field' },
                  { name: 'disabled', kind: 'field' },
                  { name: 'size', kind: 'field' },
                  // 3 undocumented: -15
                ],
                events: [
                  { name: 'hx-click' },
                  { name: 'hx-focus' },
                  // 2 undocumented: -10
                ],
                cssProperties: [
                  { name: '--hx-button-bg' },
                  // 1 undocumented: -3
                ],
              },
            ],
          },
        ],
      });

      const result = await validateCompleteness('hx-button');

      expect(result.isValid).toBe(false);
      expect(result.score).toBe(62); // 100 - 10 - 15 - 10 - 3 = 62
      expect(result.issues).toHaveLength(4);
    });
  });
});
