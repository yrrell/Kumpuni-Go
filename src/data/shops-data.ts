// src/data/shops-data.ts
import { Shop } from './definitions';

export const lubaoShops: Shop[] = [
  // --- MOTORSHOPS ---
  { id: 1, name: "RCELL ENTERPRISE", brgy: "San Pablo 2nd", type: "Motorshop", contact: "09122349876", lat: 14.919513, lng: 120.541094, openTime: 7, closeTime: 18, workDays: [1,2,3,4,5,6], status: 'approved' },
  { id: 2, name: "Bobong D' Mekaniko", brgy: "San Pablo 2nd", type: "Motorshop", contact: "09982348765", lat: 14.920145, lng: 120.539936, openTime: 8, closeTime: 17, workDays: [1,2,3,4,5,6], status: 'approved' },
  { id: 3, name: "Near San Pio Chapel", brgy: "San Pablo 2nd", type: "Motorshop & Vulcanizing", contact: "09229807634", lat: 14.924413, lng: 120.532455, openTime: 0, closeTime: 24, workDays: [0,1,2,3,4,5,6], status: 'approved' },
  { id: 6, name: "Zackee Motorcycle Parts", brgy: "Concepcion", type: "Motorshop", contact: "09123334444", lat: 14.943326, lng: 120.592052, openTime: 8, closeTime: 18, workDays: [1,2,3,4,5,6], status: 'approved' },
  { id: 7, name: "Banal's Motorshop", brgy: "San Pablo 2nd", type: "Motorshop", contact: "09123456789", lat: 14.921314, lng: 120.538243, openTime: 6, closeTime: 19, workDays: [1,2,3,4,5,6], status: 'approved' },
  { id: 8, name: "Jun's Motorsiklo Repair", brgy: "Balantacan", type: "Motorshop", contact: "09171234567", lat: 14.915200, lng: 120.527800, openTime: 7, closeTime: 17, workDays: [1,2,3,4,5,6], status: 'approved' },
  { id: 9, name: "Mang Totoy Mekaniko", brgy: "Calangain", type: "Motorshop", contact: "09281234567", lat: 14.930100, lng: 120.560400, openTime: 8, closeTime: 18, workDays: [1,2,3,4,5], status: 'approved' },
  { id: 10, name: "RJ Motor Works", brgy: "Sto. Tomas", type: "Motorshop", contact: "09391234567", lat: 14.907500, lng: 120.548700, openTime: 7, closeTime: 19, workDays: [1,2,3,4,5,6], status: 'approved' },

  // --- VULCANIZING ---
  { id: 4, name: "Lerry's Quick Fix", brgy: "Santa Cruz", type: "Vulcanizing", contact: "09123334444", lat: 14.912345, lng: 120.531234, openTime: 0, closeTime: 24, workDays: [0,1,2,3,4,5,6], status: 'approved' },
  { id: 5, name: "Pasbul's Quick Fix", brgy: "San Juan", type: "Vulcanizing", contact: "09123334444", lat: 14.934920, lng: 120.594057, openTime: 0, closeTime: 24, workDays: [0,1,2,3,4,5,6], status: 'approved' },
  { id: 11, name: "24/7 Vulcanizing – Poblacion", brgy: "Poblacion", type: "Vulcanizing", contact: "09501234567", lat: 14.924800, lng: 120.570100, openTime: 0, closeTime: 24, workDays: [0,1,2,3,4,5,6], status: 'approved' },
  { id: 12, name: "Mang Celso Vulcanizing", brgy: "Sta. Barbara", type: "Vulcanizing", contact: "09611234567", lat: 14.918600, lng: 120.583200, openTime: 6, closeTime: 20, workDays: [1,2,3,4,5,6], status: 'approved' },
  { id: 13, name: "Rapid Tire Shop", brgy: "San Isidro", type: "Vulcanizing", contact: "09721234567", lat: 14.940300, lng: 120.545600, openTime: 7, closeTime: 18, workDays: [1,2,3,4,5,6], status: 'approved' },
  { id: 14, name: "Ligtas Vulcanizing", brgy: "Lourdes", type: "Vulcanizing", contact: "09831234567", lat: 14.926700, lng: 120.536900, openTime: 0, closeTime: 24, workDays: [0,1,2,3,4,5,6], status: 'approved' },

  // --- MOTORSHOP & VULCANIZING ---
  { id: 15, name: "All-In Auto Shop", brgy: "San Pedro", type: "Motorshop & Vulcanizing", contact: "09941234567", lat: 14.922000, lng: 120.577300, openTime: 7, closeTime: 19, workDays: [1,2,3,4,5,6], status: 'approved' },
  { id: 16, name: "Kuya Ben's Repair & Tires", brgy: "Concepcion Malpitic", type: "Motorshop & Vulcanizing", contact: "09051234567", lat: 14.946100, lng: 120.588400, openTime: 6, closeTime: 18, workDays: [0,1,2,3,4,5,6], status: 'approved' },
];
