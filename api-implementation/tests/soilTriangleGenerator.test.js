/**
 * Test Suite for Soil Triangle SVG Generator
 * Tests coordinate calculations, SVG generation, and validation
 */

const { 
	SoilTriangleGenerator, 
	generateSoilTriangleSVG, 
	generateTestSVG, 
	validateSVG 
} = require('../src/utils/soilTriangleGenerator');

describe('SoilTriangleGenerator', () => {
	let generator;

	beforeEach(() => {
		generator = new SoilTriangleGenerator();
	});

	describe('Data Validation', () => {
		test('should validate correct soil data', () => {
			const validData = { sand: 40, clay: 30, silt: 30 };
			const result = generator.validateSoilData(validData);
			
			expect(result.sand).toBe(40);
			expect(result.clay).toBe(30);
			expect(result.silt).toBe(30);
		});

		test('should normalize soil data that doesn\'t sum to 100%', () => {
			const unnormalizedData = { sand: 40, clay: 30, silt: 28 }; // Sum = 98%
			const result = generator.validateSoilData(unnormalizedData);
			
			const total = result.sand + result.clay + result.silt;
			expect(Math.abs(total - 100)).toBeLessThan(0.1);
		});

		test('should throw error for missing data', () => {
			expect(() => {
				generator.validateSoilData({ sand: 40, clay: 30 });
			}).toThrow('Missing required soil composition data');
		});

		test('should throw error for negative values', () => {
			expect(() => {
				generator.validateSoilData({ sand: -10, clay: 30, silt: 80 });
			}).toThrow('Soil composition values cannot be negative');
		});

		test('should throw error for values over 100%', () => {
			expect(() => {
				generator.validateSoilData({ sand: 150, clay: 30, silt: 30 });
			}).toThrow('Soil composition values cannot exceed 100%');
		});
	});

	describe('Coordinate Calculation', () => {
		test('should calculate correct coordinates for center point', () => {
			const centerData = { sand: 33.3, clay: 33.3, silt: 33.4 };
			const point = generator.calculateSamplePoint(centerData);
			
			// Center should be approximately in middle of triangle
			expect(point.x).toBeCloseTo(250, 0);
			expect(point.y).toBeCloseTo(283, 0);
		});

		test('should calculate correct coordinates for clay vertex', () => {
			const clayData = { sand: 0, clay: 100, silt: 0 };
			const point = generator.calculateSamplePoint(clayData);
			
			// Should be at top vertex (clay)
			expect(point.x).toBe(250);
			expect(point.y).toBe(50);
		});

		test('should calculate correct coordinates for sand vertex', () => {
			const sandData = { sand: 100, clay: 0, silt: 0 };
			const point = generator.calculateSamplePoint(sandData);
			
			// Should be at bottom-left vertex (sand)
			expect(point.x).toBe(50);
			expect(point.y).toBe(400);
		});

		test('should calculate correct coordinates for silt vertex', () => {
			const siltData = { sand: 0, clay: 0, silt: 100 };
			const point = generator.calculateSamplePoint(siltData);
			
			// Should be at bottom-right vertex (silt)
			expect(point.x).toBe(450);
			expect(point.y).toBe(400);
		});
	});

	describe('Texture Classification', () => {
		test('should classify clay correctly', () => {
			const clayData = { sand: 20, clay: 60, silt: 20 };
			const classification = generator.classifyTexture(clayData);
			expect(classification).toBe('clay');
		});

		test('should classify loam correctly', () => {
			const loamData = { sand: 40, clay: 20, silt: 40 };
			const classification = generator.classifyTexture(loamData);
			expect(classification).toBe('loam');
		});

		test('should classify sandy loam correctly', () => {
			const sandyLoamData = { sand: 60, clay: 15, silt: 25 };
			const classification = generator.classifyTexture(sandyLoamData);
			expect(classification).toBe('sandy loam');
		});

		test('should classify silt loam correctly', () => {
			const siltLoamData = { sand: 20, clay: 15, silt: 65 };
			const classification = generator.classifyTexture(siltLoamData);
			expect(classification).toBe('silt loam');
		});
	});

	describe('SVG Generation', () => {
		test('should generate valid SVG markup', () => {
			const testData = { sand: 40, clay: 30, silt: 30 };
			const svg = generator.generateTriangleSVG(testData);
			
			expect(svg).toContain('<svg');
			expect(svg).toContain('</svg>');
			expect(svg).toContain('<polygon'); // Triangle outline
			expect(svg).toContain('<circle'); // Sample point
			expect(svg).toContain('chart-ready-marker');
		});

		test('should include sample point in correct position', () => {
			const testData = { sand: 40, clay: 30, silt: 30 };
			const svg = generator.generateTriangleSVG(testData);
			
			// Should contain circle element with calculated coordinates
			expect(svg).toMatch(/<circle cx="[\d.]+"/);
			expect(svg).toMatch(/cy="[\d.]+"/);
		});

		test('should include texture classification label', () => {
			const testData = { sand: 40, clay: 30, silt: 30 };
			const svg = generator.generateTriangleSVG(testData);
			
			// Should contain text element with classification
			expect(svg).toContain('Clay loam');
		});

		test('should generate error SVG for invalid data', () => {
			const svg = generator.generateErrorSVG('Test error message');
			
			expect(svg).toContain('<svg');
			expect(svg).toContain('Error Generating Triangle');
			expect(svg).toContain('Test error message');
		});
	});

	describe('SVG Validation', () => {
		test('should validate correct SVG markup', () => {
			const testData = { sand: 40, clay: 30, silt: 30 };
			const svg = generator.generateTriangleSVG(testData);
			
			expect(generator.validateSVG(svg)).toBe(true);
		});

		test('should reject invalid SVG markup', () => {
			const invalidSvg = '<div>Not an SVG</div>';
			
			expect(generator.validateSVG(invalidSvg)).toBe(false);
		});

		test('should reject empty or null input', () => {
			expect(generator.validateSVG('')).toBe(false);
			expect(generator.validateSVG(null)).toBe(false);
			expect(generator.validateSVG(undefined)).toBe(false);
		});
	});

	describe('Module Exports', () => {
		test('should export generateSoilTriangleSVG function', () => {
			const testData = { sand: 40, clay: 30, silt: 30 };
			const svg = generateSoilTriangleSVG(testData);
			
			expect(typeof svg).toBe('string');
			expect(svg).toContain('<svg');
		});

		test('should export generateTestSVG function', () => {
			const svg = generateTestSVG();
			
			expect(typeof svg).toBe('string');
			expect(svg).toContain('<svg');
		});

		test('should export validateSVG function', () => {
			const testData = { sand: 40, clay: 30, silt: 30 };
			const svg = generateSoilTriangleSVG(testData);
			
			expect(validateSVG(svg)).toBe(true);
		});
	});
});

// Integration test for visual validation
describe('Visual Validation Tests', () => {
	test('should generate test cases for manual inspection', () => {
		const testCases = [
			{ sand: 40, clay: 30, silt: 30, expected: 'clay loam' },
			{ sand: 70, clay: 15, silt: 15, expected: 'sandy loam' },
			{ sand: 20, clay: 60, silt: 20, expected: 'clay' },
			{ sand: 20, clay: 15, silt: 65, expected: 'silt loam' },
			{ sand: 85, clay: 8, silt: 7, expected: 'sand' }
		];

		testCases.forEach((testCase, index) => {
			const svg = generateSoilTriangleSVG(testCase);
			
			// Basic validation
			expect(validateSVG(svg)).toBe(true);
			expect(svg).toContain(testCase.expected.charAt(0).toUpperCase() + testCase.expected.slice(1));
			
			// Log for manual inspection if needed
			console.log(`Test case ${index + 1} (${testCase.expected}): SVG generated successfully`);
		});
	});
});
