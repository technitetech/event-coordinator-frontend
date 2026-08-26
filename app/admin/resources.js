// Admin resource metadata: labels, endpoint paths, table column definitions,
// and form fields for the generic CRUD views.

const EVENT_TYPES = [
  { value: "wedding", label: "Wedding" },
  { value: "conference", label: "Conference" },
  { value: "birthday", label: "Birthday" },
  { value: "dinner", label: "Gala Dinner" },
];

const THEMES = [
  { value: "floral", label: "Floral" },
  { value: "modern", label: "Modern" },
  { value: "tropical", label: "Tropical" },
  { value: "classic", label: "Classic Gold" },
];

const TIERS = [
  { value: "basic", label: "Basic" },
  { value: "standard", label: "Standard" },
  { value: "premium", label: "Premium" },
];

const ROLES = [
  { value: "customer", label: "Customer" },
  { value: "staff", label: "Staff" },
  { value: "admin", label: "Admin" },
];

export const RESOURCES = {
  users: {
    title: "Users",
    endpoint: "users",
    columns: [
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
      { key: "role", label: "Role", map: { customer: "Customer", staff: "Staff", admin: "Admin" } },
      { key: "created_at", label: "Joined", date: true },
    ],
    fields: [
      { key: "name", label: "Full name", type: "text", required: true },
      { key: "email", label: "Email address", type: "email", required: true },
      { key: "phone", label: "Phone", type: "tel" },
      { key: "role", label: "Role", type: "select", options: ROLES },
      { key: "password", label: "Password (min 8 chars)", type: "password", note: "Leave blank when editing to keep current password" },
    ],
  },

  stay_bookings: {
    title: "Room Stays",
    endpoint: "stay_bookings",
    columns: [
      { key: "confirmation_code", label: "Ref Code" },
      { key: "check_in_date", label: "Check In" },
      { key: "check_out_date", label: "Check Out" },
      { key: "nights", label: "Nights" },
      { key: "total_amount", label: "Total (LKR)", money: true },
      { key: "status", label: "Status" },
    ],
    fields: [
      { key: "check_in_date", label: "Check In Date", type: "date", required: true },
      { key: "check_out_date", label: "Check Out Date", type: "date", required: true },
      { key: "total_amount", label: "Total Amount (LKR)", type: "number", required: true },
      { key: "status", label: "Status", type: "select", options: [
        { value: "pending", label: "Pending" },
        { value: "confirmed", label: "Confirmed" },
        { value: "checked_in", label: "Checked In" },
        { value: "checked_out", label: "Checked Out" },
        { value: "cancelled", label: "Cancelled" },
      ]},
    ],
  },

  event_bookings: {
    title: "Event Bookings",
    endpoint: "event_bookings",
    columns: [
      { key: "customer_name", label: "Customer" },
      { key: "event_type", label: "Event type" },
      { key: "event_date", label: "Event date" },
      { key: "guests", label: "Guests" },
      { key: "total_cost", label: "Total (LKR)", money: true },
      { key: "status", label: "Status" },
    ],
    fields: [
      { key: "customer_name", label: "Customer name", type: "text", required: true },
      { key: "event_type", label: "Event type", type: "select", options: EVENT_TYPES },
      { key: "event_date", label: "Event date", type: "date", required: true },
      { key: "guests", label: "Guest count", type: "number", required: true },
      { key: "total_cost", label: "Total cost (LKR)", type: "number", required: true },
      { key: "status", label: "Status", type: "select", options: [
        { value: "pending", label: "Pending" },
        { value: "confirmed", label: "Confirmed" },
        { value: "cancelled", label: "Cancelled" },
      ]},
    ],
  },

  dining_reservations: {
    title: "Dining Reservations",
    endpoint: "dining_reservations",
    columns: [
      { key: "confirmation_code", label: "Ref Code" },
      { key: "reservation_date", label: "Date" },
      { key: "time_slot", label: "Time" },
      { key: "covers", label: "Guests" },
      { key: "occasion", label: "Occasion" },
      { key: "status", label: "Status" },
    ],
    fields: [
      { key: "reservation_date", label: "Reservation Date", type: "date", required: true },
      { key: "time_slot", label: "Time Slot", type: "text", required: true },
      { key: "covers", label: "Covers", type: "number", required: true },
      { key: "status", label: "Status", type: "select", options: [
        { value: "pending", label: "Pending" },
        { value: "confirmed", label: "Confirmed" },
        { value: "seated", label: "Seated" },
        { value: "completed", label: "Completed" },
        { value: "cancelled", label: "Cancelled" },
      ]},
    ],
  },

  room_types: {
    title: "Room Types",
    endpoint: "room_types",
    columns: [
      { key: "name", label: "Name" },
      { key: "slug", label: "Slug" },
      { key: "max_occupancy", label: "Max Guests" },
      { key: "base_rate_per_night", label: "Rate (LKR)", money: true },
      { key: "is_active", label: "Active", map: { 1: "Yes", 0: "No" } },
    ],
    fields: [
      { key: "name", label: "Room Type Name", type: "text", required: true },
      { key: "slug", label: "URL Slug", type: "text", required: true },
      { key: "tagline", label: "Tagline", type: "text" },
      { key: "max_occupancy", label: "Max Occupancy", type: "number", required: true },
      { key: "base_rate_per_night", label: "Base Rate (LKR)", type: "number", required: true },
      { key: "description", label: "Description", type: "textarea" },
    ],
  },

  venues: {
    title: "Venues",
    endpoint: "venues",
    columns: [
      { key: "name", label: "Name" },
      { key: "min_capacity", label: "Min cap." },
      { key: "max_capacity", label: "Max cap." },
      { key: "base_cost", label: "Base cost (LKR)", money: true },
      { key: "is_outdoor", label: "Setting", map: { 1: "Outdoor", 0: "Indoor" } },
    ],
    fields: [
      { key: "name", label: "Venue name", type: "text", required: true },
      { key: "min_capacity", label: "Min capacity", type: "number", required: true },
      { key: "max_capacity", label: "Max capacity", type: "number", required: true },
      { key: "base_cost", label: "Base cost (LKR)", type: "number", required: true },
      { key: "is_outdoor", label: "Is outdoor venue?", type: "select", options: [{ value: 0, label: "Indoor" }, { value: 1, label: "Outdoor" }] },
      { key: "description", label: "Description", type: "textarea" },
    ],
  },

  restaurant_menu_items: {
    title: "Restaurant Menu",
    endpoint: "restaurant_menu_items",
    columns: [
      { key: "name", label: "Dish Name" },
      { key: "price", label: "Price (LKR)", money: true },
      { key: "is_available", label: "Available", map: { 1: "Yes", 0: "No" } },
      { key: "is_signature", label: "Signature", map: { 1: "Yes", 0: "No" } },
      { key: "is_vegetarian", label: "Veg", map: { 1: "Yes", 0: "No" } },
    ],
    fields: [
      { key: "name", label: "Dish Name", type: "text", required: true },
      { key: "price", label: "Price (LKR)", type: "number", required: true },
      { key: "category_id", label: "Category ID", type: "number", required: true },
      { key: "description", label: "Description", type: "textarea" },
      { key: "is_available", label: "Available", type: "select", options: [{ value: 1, label: "Yes" }, { value: 0, label: "No" }] },
    ],
  },

  menus: {
    title: "Event Menus",
    endpoint: "menus",
    columns: [
      { key: "name", label: "Name" },
      { key: "event_type", label: "Event type" },
      { key: "price_per_head", label: "Price/head (LKR)", money: true },
    ],
    fields: [
      { key: "name", label: "Menu name", type: "text", required: true },
      { key: "event_type", label: "Event type", type: "select", options: EVENT_TYPES },
      { key: "price_per_head", label: "Price per head (LKR)", type: "number", required: true },
      { key: "description", label: "Description", type: "textarea" },
    ],
  },

  decorations: {
    title: "Decorations",
    endpoint: "decorations",
    columns: [
      { key: "name", label: "Name" },
      { key: "theme", label: "Theme" },
      { key: "tier", label: "Tier" },
      { key: "cost", label: "Cost (LKR)", money: true },
    ],
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "theme", label: "Theme", type: "select", options: THEMES },
      { key: "tier", label: "Tier", type: "select", options: TIERS },
      { key: "cost", label: "Cost (LKR)", type: "number", required: true },
    ],
  },

  event_packages: {
    title: "Packages",
    endpoint: "event_packages",
    columns: [
      { key: "name", label: "Name" },
      { key: "event_type", label: "Event type" },
      { key: "add_on_cost", label: "Add-on cost (LKR)", money: true },
    ],
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "event_type", label: "Event type", type: "select", options: EVENT_TYPES },
      { key: "add_on_cost", label: "Add-on cost (LKR)", type: "number", required: true },
      { key: "description", label: "Description", type: "textarea" },
    ],
  },

  feedback: {
    title: "Feedback & Reviews",
    endpoint: "feedback",
    columns: [
      { key: "booking_id", label: "Booking Ref" },
      { key: "overall_rating", label: "Overall (1-5)" },
      { key: "venue_rating", label: "Venue" },
      { key: "menu_rating", label: "Menu" },
      { key: "decor_rating", label: "Decor" },
      { key: "value_rating", label: "Value" },
      { key: "would_rebook", label: "Rebook?", map: { 1: "Yes", 0: "No" } },
    ],
    fields: [
      { key: "booking_id", label: "Booking ID", type: "number", required: true },
      { key: "overall_rating", label: "Overall Rating", type: "number", required: true },
      { key: "venue_rating", label: "Venue Rating", type: "number" },
      { key: "menu_rating", label: "Menu Rating", type: "number" },
      { key: "decor_rating", label: "Decor Rating", type: "number" },
      { key: "value_rating", label: "Value Rating", type: "number" },
      { key: "comment", label: "Comments", type: "textarea" },
    ],
  },
};

// Sidebar navigation structure
export const NAV_ITEMS = [
  { key: "users", label: "Users & Guests" },
  { key: "stay_bookings", label: "Stay Bookings" },
  { key: "event_bookings", label: "Event Bookings" },
  { key: "dining_reservations", label: "Dining Tables" },
  { key: "room_types", label: "Room Types" },
  { key: "venues", label: "Venues" },
  { key: "restaurant_menu_items", label: "Dining Menu" },
  { key: "menus", label: "Event Catering" },
  { key: "decorations", label: "Decorations" },
  { key: "event_packages", label: "Packages" },
  { key: "feedback", label: "Feedback" },
];
