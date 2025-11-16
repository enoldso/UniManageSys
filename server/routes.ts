import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStudentSchema, insertPaymentSchema, insertUniformIssuanceSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // School login
  app.post("/api/login/school", async (req, res) => {
    const { code, password } = req.body;
    const school = await storage.getSchoolByCode(code);
    
    if (!school || school.password !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    return res.json({ id: school.id, name: school.name, code: school.code });
  });
  
  // Student routes
  app.get("/api/students/:schoolId", async (req, res) => {
    const students = await storage.getStudents(req.params.schoolId);
    return res.json(students);
  });
  
  app.get("/api/student/:id", async (req, res) => {
    const student = await storage.getStudent(req.params.id);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }
    return res.json(student);
  });
  
  app.post("/api/students", async (req, res) => {
    try {
      const validatedData = insertStudentSchema.parse(req.body);
      const student = await storage.createStudent(validatedData);
      return res.json(student);
    } catch (error) {
      return res.status(400).json({ error: "Invalid data" });
    }
  });
  
  app.patch("/api/student/:id", async (req, res) => {
    const updated = await storage.updateStudent(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: "Student not found" });
    }
    return res.json(updated);
  });
  
  // Inventory routes
  app.get("/api/inventory/:schoolId", async (req, res) => {
    const inventory = await storage.getInventory(req.params.schoolId);
    return res.json(inventory);
  });
  
  app.get("/api/inventory/all/seller", async (req, res) => {
    try {
      // Get all schools
      const allSchools = Array.from((storage as any).schools.values());
      
      // Fetch inventory for each school
      const inventoryPromises = allSchools.map(async (school: any) => {
        return storage.getInventory(school.id);
      });
      
      const inventoryArrays = await Promise.all(inventoryPromises);
      const allInventory = inventoryArrays.flat();
      return res.json(allInventory);
    } catch (error) {
      console.error('Error fetching all inventory:', error);
      return res.status(500).json({ error: 'Failed to fetch inventory' });
    }
  });
  
  // Issue uniform - deduct from inventory and update student
  app.post("/api/issue-uniform", async (req, res) => {
    try {
      const validatedData = insertUniformIssuanceSchema.parse(req.body);
      
      // Find inventory item
      const inventoryItems = await storage.getInventory(validatedData.schoolId);
      const inventoryItem = inventoryItems.find(
        item => item.itemType === validatedData.itemType && item.size === validatedData.size
      );
      
      if (!inventoryItem) {
        return res.status(404).json({ error: "Inventory item not found" });
      }
      
      if (inventoryItem.quantity < validatedData.quantity) {
        return res.status(400).json({ error: "Insufficient stock" });
      }
      
      // Update inventory
      await storage.updateInventoryItem(inventoryItem.id, {
        quantity: inventoryItem.quantity - validatedData.quantity
      });
      
      // Create issuance record
      const issuance = await storage.createUniformIssuance(validatedData);
      
      // Update student uniform status if all items issued
      const student = await storage.getStudent(validatedData.studentId);
      if (student && student.uniformStatus !== "issued") {
        await storage.updateStudent(validatedData.studentId, {
          uniformStatus: "issued"
        });
      }
      
      return res.json(issuance);
    } catch (error) {
      return res.status(400).json({ error: "Invalid data" });
    }
  });
  
  // Payment routes
  app.get("/api/payments", async (req, res) => {
    const payments = await storage.getPayments();
    return res.json(payments);
  });
  
  app.get("/api/payments/:studentId", async (req, res) => {
    const payments = await storage.getPayments(req.params.studentId);
    return res.json(payments);
  });
  
  app.post("/api/payments", async (req, res) => {
    try {
      const validatedData = insertPaymentSchema.parse(req.body);
      const payment = await storage.createPayment(validatedData);
      
      // Update student payment info
      const student = await storage.getStudent(validatedData.studentId);
      if (student) {
        await storage.updateStudent(validatedData.studentId, {
          amountPaid: student.amountPaid + validatedData.amount,
          paymentStatus: student.amountPaid + validatedData.amount >= student.totalAmount ? "paid" : "partial"
        });
      }
      
      return res.json(payment);
    } catch (error) {
      return res.status(400).json({ error: "Invalid data" });
    }
  });
  
  // Repair routes
  app.get("/api/repairs/:schoolId", async (req, res) => {
    const repairs = await storage.getRepairs(req.params.schoolId);
    return res.json(repairs);
  });
  
  app.get("/api/repairs/all/seller", async (req, res) => {
    const repairs = await storage.getRepairs();
    return res.json(repairs);
  });
  
  // Resupply routes
  app.get("/api/resupplies/:schoolId", async (req, res) => {
    const resupplies = await storage.getResupplies(req.params.schoolId);
    return res.json(resupplies);
  });
  
  app.get("/api/resupplies/all/seller", async (req, res) => {
    const resupplies = await storage.getResupplies();
    return res.json(resupplies);
  });
  
  // Uniform issuance history
  app.get("/api/uniform-issuances/:studentId", async (req, res) => {
    const issuances = await storage.getUniformIssuances(req.params.studentId);
    return res.json(issuances);
  });
  
  app.get("/api/uniform-issuances/school/:schoolId", async (req, res) => {
    const issuances = await storage.getUniformIssuances(undefined, req.params.schoolId);
    return res.json(issuances);
  });

  const httpServer = createServer(app);

  return httpServer;
}
