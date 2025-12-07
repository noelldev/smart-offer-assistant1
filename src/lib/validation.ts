import { z } from 'zod';

/**
 * Zod schema for intake form validation
 */
export const intakeFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),

  company: z
    .string()
    .max(100, 'Company must be less than 100 characters')
    .optional()
    .or(z.literal('')),

  phone: z
    .string()
    .min(1, 'Phone is required')
    .regex(
      /^[\d\s\-+()]+$/,
      'Phone must contain only numbers, spaces, and +()-'
    ),

  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),

  address: z
    .string()
    .min(1, 'Address is required')
    .max(200, 'Address must be less than 200 characters'),

  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be less than 1000 characters'),

  difficultAccess: z.boolean(),
});

export type IntakeFormSchema = z.infer<typeof intakeFormSchema>;

/**
 * Default form values - pre-filled example for demo
 */
export const defaultFormValues: IntakeFormSchema = {
  name: 'Max Mustermann',
  company: 'Mustermann GmbH',
  phone: '+49 123 456789',
  email: 'max@mustermann.de',
  address: 'Musterstraße 123, 12345 Berlin',
  description:
    'We have water damage on the bathroom ceiling. The paint is peeling and there might be a leak in the roof above. We need someone to check and repair both the roof and repaint the ceiling.',
  difficultAccess: true,
};

/**
 * Empty form values for clearing
 */
export const emptyFormValues: IntakeFormSchema = {
  name: '',
  company: '',
  phone: '',
  email: '',
  address: '',
  description: '',
  difficultAccess: false,
};
