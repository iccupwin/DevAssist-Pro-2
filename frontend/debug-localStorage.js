// Debug script to check localStorage content
console.log('=== localStorage Debug ===');

const keys = [
  'kp_analyzer_history',
  'kp-analyzer-storage',
  'app-storage',
  'user-storage',
  'ai-storage'
];

keys.forEach(key => {
  const value = localStorage.getItem(key);
  console.log(`${key}:`, value ? JSON.parse(value) : 'null');
});

console.log('=== All localStorage keys ===');
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  console.log(`${key}: ${localStorage.getItem(key)}`);
}