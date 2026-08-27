import mysql from "mysql2/promise";

async function seed() {
  const conn = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "event_coordinator",
  });

  console.log("Connected to MySQL...");

  // 1. Create hotel_packages table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS hotel_packages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      package_type ENUM('event_menu', 'day_out') NOT NULL DEFAULT 'event_menu',
      code VARCHAR(30) NOT NULL UNIQUE,
      title VARCHAR(150) NOT NULL,
      subtitle VARCHAR(150) NULL,
      price_per_person INT NOT NULL,
      currency VARCHAR(10) NOT NULL DEFAULT 'LKR',
      minimum_pax INT NOT NULL DEFAULT 1,
      time_slot VARCHAR(60) NULL,
      badge VARCHAR(60) NULL,
      inclusions JSON NOT NULL,
      courses JSON NULL,
      dessert_options JSON NULL,
      promotional_flyer VARCHAR(255) NULL,
      description TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 2. Data from PDF Menus 01-04 & Promotional Day Out Flyers
  const packages = [
    {
      code: "MENU_01",
      package_type: "event_menu",
      title: "Menu 01 — Event Menu Package",
      subtitle: "Classic Coastal Celebration Banquet",
      price_per_person: 2600,
      minimum_pax: 20,
      time_slot: "Lunch / Dinner",
      badge: "Best Value",
      inclusions: JSON.stringify([
        "Welcome Drink",
        "Fried Rice",
        "Chicken Kuruma",
        "Fish Ambulthiyal",
        "Tempered Dhal Curry",
        "Tempered Potatoes",
        "Brinjal Moju",
        "Malay Pickle",
        "Papadam",
        "Vegetable Cutlet",
        "Selected Dessert"
      ]),
      courses: JSON.stringify({
        welcome: ["Signature Tropical Welcome Drink"],
        mains: ["Sri Lankan Fragrant Fried Rice", "Spiced Chicken Kuruma", "Southern Coastal Fish Ambulthiyal"],
        accompaniments: ["Tempered Dhal Curry", "Golden Tempered Potatoes", "Caramelized Brinjal Moju", "Traditional Malay Pickle", "Crispy Papadam", "Vegetable Cutlet"],
        dessert: ["Chefs Selected Daily Dessert"]
      }),
      dessert_options: JSON.stringify(["Chef's Special Dessert of the Day"]),
      promotional_flyer: null,
      description: "An authentic Sri Lankan event feast featuring fragrant fried rice, rich chicken kuruma, traditional fish ambulthiyal, and rich tempered accompaniments."
    },
    {
      code: "MENU_02",
      package_type: "event_menu",
      title: "Menu 02 — Event Menu Package",
      subtitle: "Seafood & Tempered Cashew Deluxe",
      price_per_person: 3500,
      minimum_pax: 25,
      time_slot: "Lunch / Dinner",
      badge: "Popular Choice",
      inclusions: JSON.stringify([
        "Welcome Drink",
        "Fried Rice",
        "Chicken Kuruma",
        "Tempered Prawns",
        "Tempered Dhal Curry",
        "Tempered Potatoes",
        "Brinjal Moju",
        "Malay Pickle",
        "Tempered Cashew",
        "Mixed Salad",
        "Maldives Fish Sambol",
        "Papadam",
        "Dessert"
      ]),
      courses: JSON.stringify({
        welcome: ["Chilled Tropical Welcome Drink"],
        mains: ["Fluffy Seasoned Fried Rice", "Aromatic Chicken Kuruma", "Lagoon Tempered Prawns"],
        accompaniments: ["Tempered Cashew Nuts", "Mixed Fresh Garden Salad", "Maldives Fish Sambol", "Tempered Dhal Curry", "Tempered Potatoes", "Brinjal Moju", "Malay Pickle", "Crispy Papadam"],
        dessert: ["Selected Fine Dessert"]
      }),
      dessert_options: JSON.stringify(["Fine Dessert of the Day"]),
      promotional_flyer: null,
      description: "Elevated coastal event dining with succulent lagoon prawns, roasted tempered cashew nuts, and fresh Maldives fish sambol."
    },
    {
      code: "MENU_03",
      package_type: "event_menu",
      title: "Menu 03 — Event Menu Package",
      subtitle: "Grand Multi-Course Coastal Feast",
      price_per_person: 4000,
      minimum_pax: 30,
      time_slot: "Lunch / Dinner",
      badge: "Executive Feast",
      inclusions: JSON.stringify([
        "Welcome Drink",
        "Fried Rice",
        "Plain Rice",
        "Fried Noodles",
        "String Hoppers",
        "Chicken Kuruma",
        "Beef or Pork Stew",
        "Fish Ambulthiyal",
        "Tempered Potato",
        "Brinjal Moju",
        "Tempered Cashew",
        "Mixed Salad",
        "Papadam",
        "Maldives Fish Sambol",
        "Dessert"
      ]),
      courses: JSON.stringify({
        welcome: ["Refreshing Welcome Mocktail"],
        staples: ["Fried Rice", "Steamed Plain Rice", "Wok-Fried Noodles", "Fresh String Hoppers"],
        mains: ["Chicken Kuruma", "Slow-Simmered Beef or Pork Stew", "Fish Ambulthiyal"],
        accompaniments: ["Tempered Cashew Nuts", "Tempered Potatoes", "Brinjal Moju", "Mixed Garden Salad", "Maldives Fish Sambol", "Papadam"],
        dessert: ["Gourmet Dessert Course"]
      }),
      dessert_options: JSON.stringify(["Gourmet Coastal Dessert Duo"]),
      promotional_flyer: null,
      description: "A lavish multi-staple feast with string hoppers, fried noodles, beef or pork stew, chicken kuruma, and signature accompaniments."
    },
    {
      code: "MENU_04",
      package_type: "event_menu",
      title: "Menu 04 — Imperial Coastal Banquet",
      subtitle: "Ultimate Spread with 5-Course Dessert Buffet",
      price_per_person: 5500,
      minimum_pax: 35,
      time_slot: "Lunch / Dinner",
      badge: "Imperial VIP",
      inclusions: JSON.stringify([
        "Welcome Drink",
        "Fried Rice",
        "Plain Rice",
        "Savory Rice",
        "Chicken Kuruma",
        "Beef Deviled",
        "Pork Deviled",
        "Fish Stew or Deviled",
        "Potato Tempered",
        "Brinjal Moju",
        "Prawns Deviled",
        "Dhal Curry",
        "Cashew Mud Curry",
        "Mixed Salad",
        "Egg Salad",
        "Malay Pickle or Sinhala Traditional Achcharu",
        "Papadam",
        "Full 5-Item Dessert Selection (Ice Cream, Watalappan, Fruit Platters, Chocolate Mousse, Strawberry Mousse)"
      ]),
      courses: JSON.stringify({
        welcome: ["Royal Welcome Elixir"],
        staples: ["Fragrant Fried Rice", "Steamed Rice", "Golden Savory Rice"],
        mains: ["Chicken Kuruma", "Fiery Beef Deviled", "Pork Deviled", "Fish Stew or Deviled", "Spiced Lagoon Prawns Deviled"],
        accompaniments: ["Rich Cashew Nut Mud Curry", "Tempered Potato", "Brinjal Moju", "Dhal Curry", "Fresh Egg Salad", "Garden Mixed Salad", "Sinhala Traditional Achcharu / Malay Pickle", "Papadam"],
        dessert_selection: ["Artisanal Ice Cream", "Traditional Sri Lankan Watalappan", "Fresh Tropical Fruit Platters", "Silky Chocolate Mousse", "Strawberry Mousse"]
      }),
      dessert_options: JSON.stringify([
        "Artisanal Ice Cream",
        "Traditional Watalappan",
        "Fresh Tropical Fruit Platters",
        "Silky Chocolate Mousse",
        "Strawberry Mousse"
      ]),
      promotional_flyer: null,
      description: "Our premier VIP gala package featuring three deviled meats & seafood, rich cashew mud curry, and a complete 5-item luxury dessert buffet."
    },
    {
      code: "DAY_OUT_01",
      package_type: "day_out",
      title: "Perfect Weekend Day Out",
      subtitle: "All-Inclusive Coastal Day Outing & Pool Experience",
      price_per_person: 4000,
      minimum_pax: 1,
      time_slot: "10:00 AM – 5:00 PM",
      badge: "Weekend Special",
      inclusions: JSON.stringify([
        "Chilled Welcome Drink on Arrival",
        "Full Swimming Pool Access overlooking the ocean",
        "International Set Menu / Lunch Buffet (25+ PAX upgraded to International Buffet)",
        "Evening Ceylon Tea or Coffee with Hot Savory Snack",
        "24/7 High Security & Calm Coastal Environment",
        "Free Changing Room for groups over 10 PAX"
      ]),
      courses: JSON.stringify({
        welcome: ["Welcome Drink on Arrival"],
        lunch_menu_01: ["Sri Lankan Yellow Rice", "Chicken Curry or Fish Stew", "02 Vegetable Curries", "02 Vegetable Cutlets", "Chutney, Papadam & Pickle"],
        lunch_menu_02: ["Seafood / Chicken Fried Rice or Fried Noodles", "Deviled Chicken or Fish Stew", "Vegetable Chopsuey", "02 Vegetable Cutlets", "Chutney, Chilli Paste & Prawn Crackers"],
        desserts: ["Fruit Salad with Ice Cream", "Fresh Cut Fruit Platter", "Dessert of the Day"],
        evening: ["Freshly Brewed Ceylon Tea / Coffee with Hot Chef Snack"]
      }),
      dessert_options: JSON.stringify(["Fruit Salad with Ice Cream", "Fresh Cut Fruits", "Dessert of the Day"]),
      promotional_flyer: "/images/promo1.jpeg",
      description: "Relax, unwind, and enjoy a seaside escape in Negombo with pool access, lunch spread, evening tea, and changing rooms."
    }
  ];

  for (const pkg of packages) {
    await conn.query(
      `
      INSERT INTO hotel_packages 
        (code, package_type, title, subtitle, price_per_person, minimum_pax, time_slot, badge, inclusions, courses, dessert_options, promotional_flyer, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        title=VALUES(title),
        subtitle=VALUES(subtitle),
        price_per_person=VALUES(price_per_person),
        minimum_pax=VALUES(minimum_pax),
        time_slot=VALUES(time_slot),
        badge=VALUES(badge),
        inclusions=VALUES(inclusions),
        courses=VALUES(courses),
        dessert_options=VALUES(dessert_options),
        promotional_flyer=VALUES(promotional_flyer),
        description=VALUES(description)
    `,
      [
        pkg.code,
        pkg.package_type,
        pkg.title,
        pkg.subtitle,
        pkg.price_per_person,
        pkg.minimum_pax,
        pkg.time_slot,
        pkg.badge,
        pkg.inclusions,
        pkg.courses,
        pkg.dessert_options,
        pkg.promotional_flyer,
        pkg.description,
      ]
    );
  }

  // Also sync the default menus table
  await conn.query(`
    INSERT INTO menus (id, name, event_type, price_per_head, description)
    VALUES
      (1, 'Menu 01 — Classic Event Banquet', 'wedding', 2600, 'Welcome Drink, Fried Rice, Chicken Kuruma, Fish Ambulthiyal, Tempered Dhal & Potatoes, Brinjal Moju, Pickle, Papadam, Cutlet, Dessert'),
      (2, 'Menu 02 — Seafood & Cashew Deluxe', 'conference', 3500, 'Welcome Drink, Fried Rice, Chicken Kuruma, Tempered Prawns, Cashew, Dhal & Potatoes, Moju, Pickle, Salad, Sambol, Papadam, Dessert'),
      (3, 'Menu 03 — Grand Multi-Course Feast', 'birthday', 4000, 'Welcome Drink, Fried/Plain Rice, Noodles, String Hoppers, Chicken Kuruma, Stew, Fish Ambulthiyal, Cashew, Moju, Salad, Sambol, Dessert'),
      (4, 'Menu 04 — Imperial Coastal Banquet', 'dinner', 5500, 'Welcome Drink, Fried/Plain/Savory Rice, Chicken Kuruma, Deviled Meats & Seafood, Cashew Mud Curry, 5-Course Dessert Buffet')
    ON DUPLICATE KEY UPDATE
      name=VALUES(name),
      price_per_head=VALUES(price_per_head),
      description=VALUES(description)
  `);

  console.log("Successfully seeded hotel_packages and menus tables!");
  const [rows] = await conn.query("SELECT id, code, title, price_per_person FROM hotel_packages");
  console.table(rows);

  await conn.end();
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
