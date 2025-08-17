// Mock implementation of chalk for Jest tests
const identity = (str) => str;

const mockChalk = {
  // Color functions
  red: identity,
  green: identity,
  blue: identity,
  yellow: identity,
  cyan: identity,
  magenta: identity,
  white: identity,
  gray: identity,
  grey: identity,
  
  // Style functions
  bold: identity,
  dim: identity,
  italic: identity,
  underline: identity
};

// Add chained methods (color.bold, etc.)
Object.keys(mockChalk).forEach(color => {
  if (typeof mockChalk[color] === 'function') {
    mockChalk[color].bold = identity;
    mockChalk[color].dim = identity;
    mockChalk[color].italic = identity;
    mockChalk[color].underline = identity;
    
    // Add colors to each style
    Object.keys(mockChalk).forEach(style => {
      if (typeof mockChalk[style] === 'function') {
        mockChalk[color][style] = identity;
      }
    });
  }
});

// Support both default export and named exports
module.exports = mockChalk;
module.exports.default = mockChalk;
