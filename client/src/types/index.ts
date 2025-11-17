import { Inventory as BaseInventory } from '@shared/schema';

export interface Inventory extends BaseInventory {
  schoolName?: string;
}

export interface Student {
  id: string;
  name: string;
  admissionNumber: string;
  // Add other student fields as needed
}
