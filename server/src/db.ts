import { PrismaClient } from '@prisma/client';

export const db = new PrismaClient();

// Define Prisma schema types
export interface Inventory {
  id: string;
  schoolId: string;
  itemType: string;
  size: string;
  quantity: number;
  lowStockThreshold: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Student {
  id: string;
  name: string;
  admissionNumber: string;
  schoolId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  type: 'ISSUE' | 'RETURN' | 'ADJUSTMENT';
  itemId: string;
  studentId: string | null;
  schoolId: string;
  quantity: number;
  notes?: string | null;
  createdAt: Date;
}
