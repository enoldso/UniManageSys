import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';

export const inventoryRouter = Router();

// Get inventory for a specific school
inventoryRouter.get('/:schoolId', async (req, res) => {
  try {
    const { schoolId } = req.params;
    
    const inventory = await db.inventory.findMany({
      where: { schoolId },
      orderBy: { itemType: 'asc' },
    });
    
    res.json(inventory);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// Add new inventory item
inventoryRouter.post('/', async (req, res) => {
  try {
    const schema = z.object({
      schoolId: z.string(),
      itemType: z.string().min(1, 'Item type is required'),
      size: z.string().min(1, 'Size is required'),
      quantity: z.number().int().min(0, 'Quantity must be 0 or more'),
      lowStockThreshold: z.number().int().min(1, 'Low stock threshold must be at least 1'),
    });

    const data = schema.parse(req.body);
    
    const newItem = await db.inventory.create({
      data: {
        ...data,
        quantity: parseInt(data.quantity as any),
        lowStockThreshold: parseInt(data.lowStockThreshold as any) || 5,
      },
    });
    
    res.status(201).json(newItem);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error('Error adding inventory item:', error);
    res.status(500).json({ error: 'Failed to add inventory item' });
  }
});

// Issue uniform to student
inventoryRouter.post('/issue-uniform', async (req, res) => {
  try {
    const schema = z.object({
      itemId: z.string(),
      studentId: z.string(),
      quantity: z.number().int().min(1, 'Quantity must be at least 1'),
    });

    const { itemId, studentId, quantity } = schema.parse(req.body);
    
    // Check if item exists and has enough quantity
    const item = await db.inventory.findUnique({
      where: { id: itemId },
    });
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    if (item.quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient quantity in stock' });
    }
    
    // Update inventory
    await db.inventory.update({
      where: { id: itemId },
      data: {
        quantity: {
          decrement: quantity,
        },
      },
    });
    
    // Record the transaction
    await db.transaction.create({
      data: {
        type: 'ISSUE',
        itemId,
        studentId,
        quantity,
        schoolId: item.schoolId,
      },
    });
    
    res.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error('Error issuing uniform:', error);
    res.status(500).json({ error: 'Failed to issue uniform' });
  }
});

export default inventoryRouter;
