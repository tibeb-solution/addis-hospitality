export const WORK_SECTORS = ["cafe", "restaurant"] as const;
export type WorkSector = (typeof WORK_SECTORS)[number];

export const POSITIONS_BY_SECTOR: Record<WorkSector, readonly string[]> = {
  cafe: [
    "Accountant", "Storekeeper", "Inventory Controller", "Purchasing Officer",
    "Café Manager", "Café Supervisor", "Shift Leader", "Operations Supervisor",
    "Delivery Rider/Driver", "Cashier", "POS Operator", "Host/Hostess",
    "Waiter/Waitress", "Barista", "Junior Barista", "Juice Maker",
    "Bartender", "Pastry Chef", "Baker", "Bakery Assistant", "Commis Chef",
    "Cook", "Fast Food Maker", "Pizza & Burger Maker", "Breakfast Cook",
    "Kitchen Helper", "Cleaner", "Steward",
  ],
  restaurant: [
    "General Manager", "Restaurant Manager", "Assistant Restaurant Manager",
    "Operations Manager", "Branch Manager", "Restaurant Supervisor",
    "Shift Supervisor", "Floor Supervisor", "F&B Manager", "HR Manager",
    "HR Officer", "Accountant", "Finance Officer", "Cash Collector",
    "Procurement Officer", "Purchasing Officer", "Store Manager", "Storekeeper",
    "Inventory Controller", "Cost Controller", "F&B Cost Controller",
    "Restaurant Captain", "Head Waiter", "Waiter/Waitress", "Runner",
    "Host/Hostess", "Receptionist", "Greeter", "Cashier", "POS Operator",
    "Customer Service Officer", "Reservation Officer", "Takeaway Attendant",
    "Delivery Coordinator", "Bar Manager", "Bar Supervisor", "Head Bartender",
    "Bartender", "Barista", "Junior Barista", "Juicer", "Juice Maker",
    "Beverage Attendant", "Executive Chef", "Head Chef", "Sous Chef",
    "Chef de Partie", "Commis Chef", "Assistant Chef", "Grill Chef", "Fry Chef",
    "Sauce Chef", "Pastry Chef", "Bakery Chef", "Pizza Chef/Pizzaiolo",
    "Cold Kitchen Chef", "Butcher", "Kitchen Helper", "Dishwasher", "Steward",
  ],
};

export const EMPLOYEE_POSITIONS = POSITIONS_BY_SECTOR.restaurant;

export function isKnownEmployeePosition(value?: string | null) {
  return Boolean(value && EMPLOYEE_POSITIONS.includes(value as (typeof EMPLOYEE_POSITIONS)[number]));
}

export function getPositionChoice(value?: string | null) {
  return value && isKnownEmployeePosition(value) ? value : value ? OTHER_POSITION : "";
}

export function getPositionsForSector(sector?: string | null) {
  return sector === "cafe" || sector === "restaurant"
    ? POSITIONS_BY_SECTOR[sector]
    : [];
}
