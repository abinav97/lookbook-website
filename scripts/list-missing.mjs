import items from '../src/data/closet-items.json' with { type: 'json' };

const missing = items.filter(i => !i.images || i.images.length === 0);
console.log(`${missing.length} items without images:\n`);
missing.forEach(i => {
  const brand = i.brand ? ` (${i.brand})` : '';
  console.log(`- ${i.name}${brand} [${i.category}] — ${i.color}`);
});
