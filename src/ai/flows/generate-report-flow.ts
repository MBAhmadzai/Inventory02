'use server';
/**
 * @fileOverview A flow for generating a product inventory report for a specific time frame.
 *
 * - generateReport - A function that generates a summary report from product data.
 * - ProductReportInput - The input type for the generateReport function.
 * - ProductReportOutput - The return type for the generateReport function.
 */

import { ai } from '@/ai/genkit';
import { Product } from '@/lib/definitions';
import { z } from 'zod';
import { format } from 'date-fns';

const ProductReportInputSchema = z.object({
  products: z.array(
    z.object({
      id: z.string(),
      idType: z.enum(['imei', 'barcode']),
      brand: z.string(),
      name: z.string(),
      color: z.string(),
      type: z.string(),
      description: z.string().optional(),
      status: z.string(),
      createdAt: z.number(),
      updatedAt: z.number(),
      history: z
        .array(
          z.object({
            status: z.string(),
            timestamp: z.number(),
          })
        )
        .optional(),
      customerName: z.string().optional(),
      customerPhone: z.string().optional(),
      customerAddress: z.string().optional(),
      soldAt: z.number().optional(),
    })
  ),
  startDate: z.string().describe('The start date of the reporting period.'),
  endDate: z.string().describe('The end date of the reporting period.'),
});

export type ProductReportInput = z.infer<typeof ProductReportInputSchema>;

const ProductInfoSchema = z.object({
  name: z.string().describe("The full name of the product (brand and name)."),
  entryTime: z.string().describe("The creation date of the product in a readable format (e.g., 'Month Day, Year')."),
  soldTime: z.string().describe("The date the product was sold in a readable format (e.g., 'Month Day, Year'). If not sold, this should be 'N/A'."),
  status: z.string().describe("The current status of the product, formatted nicely (e.g., 'In Repair', 'Parts Used').")
});

const ProductReportOutputSchema = z.object({
  reportTitle: z.string().default('Inventory Report'),
  startDate: z.string(),
  endDate: z.string(),
  products: z.array(ProductInfoSchema),
  availableItemsCount: z.number().describe("The total count of products with the status 'available'.")
});
export type ProductReportOutput = z.infer<typeof ProductReportOutputSchema>;

export async function generateReport(
  products: Product[],
  startDate: Date,
  endDate: Date
): Promise<ProductReportOutput> {
  const validatedInput = ProductReportInputSchema.parse({
    products: products.map((p) => ({
      ...p,
      description: p.description || undefined,
    })),
    startDate: format(startDate, 'yyyy-MM-dd'),
    endDate: format(endDate, 'yyyy-MM-dd'),
  });
  return generateReportFlow(validatedInput);
}

const generateReportPrompt = ai.definePrompt(
  {
    name: 'generateReportPrompt',
    input: { schema: ProductReportInputSchema },
    output: { schema: ProductReportOutputSchema },
    prompt: `You are an expert inventory analyst. You have been provided with a list of products in JSON format for a specific time frame.

Your task is to process this data and return a structured JSON object based on the output schema. This JSON will be used to generate a PDF report.

The report title must be 'Inventory Report'.

Here is the product data for the period from {{startDate}} to {{endDate}}:
{{{JSON.stringify products}}}

Your output must be a JSON object containing the following fields:
1.  **reportTitle**: Set this to 'Inventory Report'.
2.  **startDate**: The start date of the report period, formatted as 'Month Day, Year'.
3.  **endDate**: The end date of the report period, formatted as 'Month Day, Year'.
4.  **products**: An array of product objects, where each object represents a row in the report. For each product:
    *   **name**: The product's full name, combining brand and name (e.g., "Apple iPhone 15 Pro").
    *   **entryTime**: The product's creation date ('createdAt'), formatted as a readable date (e.g., 'January 1, 2024').
    *   **soldTime**: Find the 'sold' status in the product's history. If it exists, format the corresponding timestamp as a readable date. If the product was not sold, this value must be 'N/A'.
    *   **status**: The current 'status' of the product. Format it to be human-readable (e.g., 'in_repair' should become 'In Repair').
5.  **availableItemsCount**: The total number of products that currently have the status 'available'.

If no products are provided, the 'products' array in your output should be empty and 'availableItemsCount' should be 0.
`,
  }
);


export const generateReportFlow = ai.defineFlow(
  {
    name: 'generateReportFlow',
    inputSchema: ProductReportInputSchema,
    outputSchema: ProductReportOutputSchema,
  },
  async (input) => {
    
    const { output } = await generateReportPrompt(input);
    
    if (!output) {
      throw new Error("Failed to generate report from AI");
    }

    // Re-format dates for display
    output.startDate = format(new Date(input.startDate), 'PPP');
    output.endDate = format(new Date(input.endDate), 'PPP');

    return output;
  }
);
