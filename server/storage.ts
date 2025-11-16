import { 
  type School, 
  type InsertSchool,
  type Student,
  type InsertStudent,
  type Inventory,
  type InsertInventory,
  type Repair,
  type InsertRepair,
  type Resupply,
  type InsertResupply,
  type Payment,
  type InsertPayment,
  type UniformIssuance,
  type InsertUniformIssuance
} from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // School methods
  getSchool(id: string): Promise<School | undefined>;
  getSchoolByCode(code: string): Promise<School | undefined>;
  createSchool(school: InsertSchool): Promise<School>;
  
  // Student methods
  getStudents(schoolId: string): Promise<Student[]>;
  getStudent(id: string): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: string, updates: Partial<Student>): Promise<Student | undefined>;
  
  // Inventory methods
  getInventory(schoolId: string): Promise<Inventory[]>;
  getInventoryItem(id: string): Promise<Inventory | undefined>;
  createInventoryItem(item: InsertInventory): Promise<Inventory>;
  updateInventoryItem(id: string, updates: Partial<Inventory>): Promise<Inventory | undefined>;
  
  // Repair methods
  getRepairs(schoolId?: string): Promise<Repair[]>;
  createRepair(repair: InsertRepair): Promise<Repair>;
  
  // Resupply methods
  getResupplies(schoolId?: string): Promise<Resupply[]>;
  createResupply(resupply: InsertResupply): Promise<Resupply>;
  
  // Payment methods
  getPayments(studentId?: string): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  
  // Uniform Issuance methods
  getUniformIssuances(studentId?: string, schoolId?: string): Promise<UniformIssuance[]>;
  createUniformIssuance(issuance: InsertUniformIssuance): Promise<UniformIssuance>;
}

export class MemStorage implements IStorage {
  private schools: Map<string, School>;
  private students: Map<string, Student>;
  private inventory: Map<string, Inventory>;
  private repairs: Map<string, Repair>;
  private resupplies: Map<string, Resupply>;
  private payments: Map<string, Payment>;
  private uniformIssuances: Map<string, UniformIssuance>;

  constructor() {
    this.schools = new Map();
    this.students = new Map();
    this.inventory = new Map();
    this.repairs = new Map();
    this.resupplies = new Map();
    this.payments = new Map();
    this.uniformIssuances = new Map();
  }

  async getSchool(id: string): Promise<School | undefined> {
    return this.schools.get(id);
  }

  async getSchoolByCode(code: string): Promise<School | undefined> {
    return Array.from(this.schools.values()).find(
      (school) => school.code === code,
    );
  }

  async createSchool(insertSchool: InsertSchool): Promise<School> {
    const id = randomUUID();
    const school: School = { ...insertSchool, id };
    this.schools.set(id, school);
    return school;
  }

  async getStudents(schoolId: string): Promise<Student[]> {
    return Array.from(this.students.values()).filter(
      (student) => student.schoolId === schoolId,
    );
  }

  async getStudent(id: string): Promise<Student | undefined> {
    return this.students.get(id);
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const id = randomUUID();
    const student: Student = { 
      ...insertStudent, 
      id,
      passportPhotoUrl: insertStudent.passportPhotoUrl ?? null,
      parentEmail: insertStudent.parentEmail ?? null,
      trouserSize: insertStudent.trouserSize ?? null,
      skirtSize: insertStudent.skirtSize ?? null,
      sweaterSize: insertStudent.sweaterSize ?? null,
      amountPaid: insertStudent.amountPaid ?? 0,
    };
    this.students.set(id, student);
    return student;
  }

  async updateStudent(id: string, updates: Partial<Student>): Promise<Student | undefined> {
    const student = this.students.get(id);
    if (!student) return undefined;
    
    const updated = { ...student, ...updates };
    this.students.set(id, updated);
    return updated;
  }

  async getInventory(schoolId: string): Promise<Inventory[]> {
    return Array.from(this.inventory.values()).filter(
      (item) => item.schoolId === schoolId,
    );
  }

  async getInventoryItem(id: string): Promise<Inventory | undefined> {
    return this.inventory.get(id);
  }

  async createInventoryItem(insertItem: InsertInventory): Promise<Inventory> {
    const id = randomUUID();
    const item: Inventory = { ...insertItem, id };
    this.inventory.set(id, item);
    return item;
  }

  async updateInventoryItem(id: string, updates: Partial<Inventory>): Promise<Inventory | undefined> {
    const item = this.inventory.get(id);
    if (!item) return undefined;
    
    const updated = { ...item, ...updates };
    this.inventory.set(id, updated);
    return updated;
  }

  async getRepairs(schoolId?: string): Promise<Repair[]> {
    const allRepairs = Array.from(this.repairs.values());
    if (schoolId) {
      return allRepairs.filter((repair) => repair.schoolId === schoolId);
    }
    return allRepairs;
  }

  async createRepair(insertRepair: InsertRepair): Promise<Repair> {
    const id = randomUUID();
    const repair: Repair = { 
      ...insertRepair, 
      id,
      completedDate: insertRepair.completedDate ?? null,
    };
    this.repairs.set(id, repair);
    return repair;
  }

  async getResupplies(schoolId?: string): Promise<Resupply[]> {
    const allResupplies = Array.from(this.resupplies.values());
    if (schoolId) {
      return allResupplies.filter((resupply) => resupply.schoolId === schoolId);
    }
    return allResupplies;
  }

  async createResupply(insertResupply: InsertResupply): Promise<Resupply> {
    const id = randomUUID();
    const resupply: Resupply = { 
      ...insertResupply, 
      id,
      deliveryNotes: insertResupply.deliveryNotes ?? null,
    };
    this.resupplies.set(id, resupply);
    return resupply;
  }

  async getPayments(studentId?: string): Promise<Payment[]> {
    const allPayments = Array.from(this.payments.values());
    if (studentId) {
      return allPayments.filter((payment) => payment.studentId === studentId);
    }
    return allPayments;
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const id = randomUUID();
    const payment: Payment = { ...insertPayment, id };
    this.payments.set(id, payment);
    return payment;
  }

  async getUniformIssuances(studentId?: string, schoolId?: string): Promise<UniformIssuance[]> {
    let issuances = Array.from(this.uniformIssuances.values());
    
    if (studentId) {
      issuances = issuances.filter((issuance) => issuance.studentId === studentId);
    }
    
    if (schoolId) {
      issuances = issuances.filter((issuance) => issuance.schoolId === schoolId);
    }
    
    return issuances;
  }

  async createUniformIssuance(insertIssuance: InsertUniformIssuance): Promise<UniformIssuance> {
    const id = randomUUID();
    const issuance: UniformIssuance = { ...insertIssuance, id };
    this.uniformIssuances.set(id, issuance);
    return issuance;
  }
}

export const storage = new MemStorage();
