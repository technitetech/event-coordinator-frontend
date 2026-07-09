// Each resource describes: the API endpoint (table name), the columns shown in
// the table, and the fields shown in the add/edit form. The generic
// ResourceManager renders everything from this config.

const EVENT_TYPES = ["wedding", "conference", "birthday", "dinner"];

export const RESOURCES = {
  users: {
    title: "Users",
    endpoint: "users",
    columns: [
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
      { key: "role", label: "Role" },
    ],
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "email", label: "Email", type: "text", required: true },
      { key: "phone", label: "Phone", type: "text" },
      { key: "role", label: "Role", type: "select", options: ["customer", "staff", "admin"] },
      { key: "password", label: "Password", type: "password", newOnly: true,
        hint: "Required when adding a user. Leave blank when editing to keep the current password." },
    ],
  },

  event_bookings: {
    title: "Bookings",
    endpoint: "event_bookings",
    columns: [
      { key: "customer_name", label: "Customer" },
      { key: "event_type", label: "Event" },
      { key: "event_date", label: "Date" },
      { key: "venue_name", label: "Venue" },
      { key: "guests", label: "Guests" },
      { key: "total_cost", label: "Total (LKR)", money: true },
      { key: "status", label: "Status", badge: true },
    ],
    fields: [
      { key: "customer_name", label: "Customer name", type: "text", required: true },
      { key: "event_type", label: "Event type", type: "select", options: EVENT_TYPES },
      { key: "event_date", label: "Event date", type: "date", required: true },
      { key: "venue_id", label: "Venue ID", type: "number" },
      { key: "guests", label: "Guests", type: "number", required: true },
      { key: "total_cost", label: "Total cost (LKR)", type: "number", required: true },
      { key: "status", label: "Status", type: "select", options: ["pending", "confirmed", "cancelled"] },
    ],
  },

  venues: {
    title: "Venues",
    endpoint: "venues",
    columns: [
      { key: "name", label: "Name" },
      { key: "min_capacity", label: "Min" },
      { key: "max_capacity", label: "Max" },
      { key: "base_cost", label: "Base cost (LKR)", money: true },
      { key: "is_outdoor", label: "Type", map: { 0: "Indoor", 1: "Outdoor" } },
    ],
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "min_capacity", label: "Min capacity", type: "number", required: true },
      { key: "max_capacity", label: "Max capacity", type: "number", required: true },
      { key: "base_cost", label: "Base cost (LKR)", type: "number", required: true },
      { key: "is_outdoor", label: "Setting", type: "select",
        options: [{ value: 0, label: "Indoor" }, { value: 1, label: "Outdoor" }], numeric: true },
      { key: "description", label: "Description", type: "textarea" },
    ],
  },

  menus: {
    title: "Menus",
    endpoint: "menus",
    columns: [
      { key: "name", label: "Name" },
      { key: "event_type", label: "Event type" },
      { key: "price_per_head", label: "Price / head (LKR)", money: true },
    ],
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
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
      { key: "tier", label: "Tier", badge: true },
      { key: "cost", label: "Cost (LKR)", money: true },
    ],
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "theme", label: "Theme", type: "select", options: ["floral", "modern", "tropical", "classic"] },
      { key: "tier", label: "Tier", type: "select", options: ["basic", "standard", "premium"] },
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
};

// Sidebar order
export const NAV_ITEMS = [
  { key: "users", label: "Users" },
  { key: "event_bookings", label: "Bookings" },
  { key: "venues", label: "Venues" },
  { key: "menus", label: "Menus" },
  { key: "decorations", label: "Decorations" },
  { key: "event_packages", label: "Packages" },
];
