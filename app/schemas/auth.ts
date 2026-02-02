import z from "zod"

export const loginSchema = z.object({
    email: z.email('Invalid email'),
    password: z.string('Password is required').min(8, 'Must be at least 8 characters')
  })

export type LoginSchema = z.output<typeof loginSchema>

export const registerSchema = z.object({
    email: z.email('Invalid email'),
    password: z.string('Password is required').min(8, 'Must be at least 8 characters'),
    name: z.string('Name is required'),
  })

export type RegisterSchema = z.output<typeof registerSchema>