import mysql from "mysql2/promise";

async function main() {
  const conn = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "event_coordinator",
  });

  console.log("Connected to MySQL database.");

  // Update room types
  await conn.query(`
    UPDATE room_types SET 
      name = 'Deluxe Garden Room',
      tagline = 'Wake up to lush tropical gardens and coastal ocean breeze',
      description = 'Our signature garden-view rooms overlook manicured tropical palms and coastal flora. Warm wooden tones, Ceylon handloom textiles, and a deep soaking tub define this sanctuary.'
    WHERE slug = 'deluxe-garden'
  `);

  await conn.query(`
    UPDATE room_types SET 
      name = 'Deluxe Ocean View Room',
      tagline = 'Panoramic views of the Indian Ocean & Golden Beach',
      description = 'Floor-to-ceiling windows frame the glistening Indian Ocean and golden Negombo shoreline. Designed for the discerning traveller seeking coastal serenity and luxury.'
    WHERE slug = 'deluxe-mountain'
  `);

  await conn.query(`
    UPDATE room_types SET 
      tagline = 'Where coastal luxury meets the ocean breeze',
      description = 'The Junior Suite adds a private sitting room and a wraparound oceanfront balcony to the Deluxe experience. Ideal for couples celebrating a special occasion.'
    WHERE slug = 'junior-suite'
  `);

  await conn.query(`
    UPDATE room_types SET 
      tagline = 'The pinnacle of beachfront luxury',
      description = 'Our Grand Suite occupies the entire oceanfront top floor. A private dining area, butler pantry, and 270-degree panoramic ocean sunset views make this the most coveted suite in the resort.'
    WHERE slug = 'grand-suite'
  `);

  await conn.query(`
    UPDATE room_types SET 
      name = 'Heritage Beachfront Villa',
      tagline = 'A private coastal haven within the resort',
      description = 'Detached colonial beachfront villa set within a private walled coconut garden. Complete with a plunge pool, private ocean veranda, and personal chef service. Absolute privacy by the sea.'
    WHERE slug = 'heritage-villa'
  `);

  // Update restaurant menu items
  await conn.query(`
    UPDATE restaurant_menu_items SET 
      name = 'Negombo Coastal Full Breakfast',
      description = 'Two Ceylon farm eggs, bacon, grilled tomato, sautéed mushrooms, sourdough toast, and a pot of artisan Ceylon tea'
    WHERE name LIKE '%Nuwara Eliya Full Breakfast%' OR name LIKE '%Full Breakfast%'
  `);

  await conn.query(`
    UPDATE restaurant_menu_items SET 
      name = 'Pot of Ceylon Artisan Tea',
      description = 'Seasonal single-origin Ceylon Pekoe, brewed to order, served with milk, lemon, and sugar'
    WHERE name LIKE '%Estate Pekoe Tea%' OR name LIKE '%Nuwara Eliya%'
  `);

  console.log("Successfully updated live database to Negombo coastal resort!");
  await conn.end();
}

main().catch(console.error);
