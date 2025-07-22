import { z } from "zod";
// File model for CSV files in the backend dataset folder

export const CsvFileSchema = z.object({
  filename: z.string().endsWith('.csv'),
  path: z.string(),
  size: z.number().int().nonnegative(),
  uploadedAt: z.string().datetime().optional(), // ISO string
  columns: z.array(z.string()).optional(), // Optional: column headers
  rowCount: z.number().int().nonnegative().optional(), // Optional: number of rows
});

export type CsvFile = z.infer<typeof CsvFileSchema>;
