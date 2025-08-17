// Mock implementation of cli-table3 for Jest tests
class MockTable {
  constructor(options = {}) {
    this.options = options;
    this.rows = [];
  }

  push(...rows) {
    this.rows.push(...rows);
  }

  toString() {
    // Simple string representation for testing
    const header = this.options.head ? this.options.head.join(' | ') + '\n' : '';
    const rows = this.rows.map(row => {
      if (Array.isArray(row)) {
        return row.join(' | ');
      }
      return String(row);
    }).join('\n');
    
    return header + rows;
  }
}

module.exports = MockTable;
module.exports.default = MockTable;
