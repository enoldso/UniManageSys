import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const schools = pgTable("schools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  password: text("password").notNull(),
});

export const students = pgTable("students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: varchar("school_id").notNull(),
  name: text("name").notNull(),
  admissionNumber: text("admission_number").notNull(),
  age: integer("age").notNull(),
  grade: text("grade").notNull(),
  passportPhotoUrl: text("passport_photo_url"),
  parentName: text("parent_name").notNull(),
  parentPhone: text("parent_phone").notNull(),
  parentEmail: text("parent_email"),
  nextOfKinName: text("next_of_kin_name").notNull(),
  nextOfKinPhone: text("next_of_kin_phone").notNull(),
  nextOfKinRelationship: text("next_of_kin_relationship").notNull(),
  shirtSize: text("shirt_size").notNull(),
  trouserSize: text("trouser_size"),
  skirtSize: text("skirt_size"),
  sweaterSize: text("sweater_size"),
  uniformStatus: text("uniform_status").notNull(),
  paymentStatus: text("payment_status").notNull(),
  amountPaid: integer("amount_paid").notNull().default(0),
  totalAmount: integer("total_amount").notNull(),
});

export const inventory = pgTable("inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: varchar("school_id").notNull(),
  itemType: text("item_type").notNull(),
  size: text("size").notNull(),
  quantity: integer("quantity").notNull(),
  lowStockThreshold: integer("low_stock_threshold").notNull(),
});

export const repairs = pgTable("repairs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: varchar("school_id").notNull(),
  studentId: varchar("student_id").notNull(),
  itemType: text("item_type").notNull(),
  status: text("status").notNull(),
  description: text("description").notNull(),
  reportedDate: timestamp("reported_date").notNull(),
  completedDate: timestamp("completed_date"),
});

export const resupplies = pgTable("resupplies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: varchar("school_id").notNull(),
  itemType: text("item_type").notNull(),
  quantity: integer("quantity").notNull(),
  scheduledDate: timestamp("scheduled_date").notNull(),
  status: text("status").notNull(),
  deliveryNotes: text("delivery_notes"),
});

export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  amount: integer("amount").notNull(),
  phoneNumber: text("phone_number").notNull(),
  mpesaRef: text("mpesa_ref").notNull(),
  status: text("status").notNull(),
  timestamp: timestamp("timestamp").notNull(),
});

export const uniformIssuances = pgTable("uniform_issuances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  schoolId: varchar("school_id").notNull(),
  itemType: text("item_type").notNull(),
  size: text("size").notNull(),
  quantity: integer("quantity").notNull(),
  issuedDate: timestamp("issued_date").notNull(),
  issuedBy: text("issued_by").notNull(),
});

export const insertSchoolSchema = createInsertSchema(schools).omit({ id: true });
export const insertStudentSchema = createInsertSchema(students).omit({ id: true });
export const insertInventorySchema = createInsertSchema(inventory).omit({ id: true });
export const insertRepairSchema = createInsertSchema(repairs).omit({ id: true });
export const insertResupplySchema = createInsertSchema(resupplies).omit({ id: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true });
export const insertUniformIssuanceSchema = createInsertSchema(uniformIssuances).omit({ id: true });

export type School = typeof schools.$inferSelect;
export type Student = typeof students.$inferSelect;
export type Inventory = typeof inventory.$inferSelect;
export type Repair = typeof repairs.$inferSelect;
export type Resupply = typeof resupplies.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type UniformIssuance = typeof uniformIssuances.$inferSelect;

export type InsertSchool = z.infer<typeof insertSchoolSchema>;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type InsertRepair = z.infer<typeof insertRepairSchema>;
export type InsertResupply = z.infer<typeof insertResupplySchema>;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type InsertUniformIssuance = z.infer<typeof insertUniformIssuanceSchema>;
