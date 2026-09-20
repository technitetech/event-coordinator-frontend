import MenuManager from "./MenuManager";
import { adminGetMenuItems, adminGetCategories } from "./actions";

export const metadata = {
  title: "Menu Management — St. Lachland Hotel Admin",
};

export default async function MenuManagementPage() {
  let items = [];
  let categories = [];
  try {
    [items, categories] = await Promise.all([adminGetMenuItems(), adminGetCategories()]);
  } catch (err) {
    return (
      <div className="ad-content">
        <h1 className="ad-title">Menu Management</h1>
        <div className="err mt-4">{err.message}</div>
      </div>
    );
  }

  return (
    <div className="ad-content">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <span className="eyebrow">Culinary Operations</span>
          <h1 className="ad-title text-2xl md:text-3xl">Menu Management</h1>
          <p className="text-stone-500 text-xs mt-1">
            Add, edit, and manage all menu items, prices, images, and availability.
          </p>
        </div>
      </div>
      <MenuManager initialItems={items} categories={categories} />
    </div>
  );
}
