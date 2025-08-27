import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
  NEXT_PUBLIC_BASE_URL: z.string().url('NEXT_PUBLIC_BASE_URL must be a valid URL').optional().default('http://localhost:3000'),
  
  // Optional SMTP settings
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().regex(/^\d+$/, 'SMTP_PORT must be a number').optional(),
  SMTP_USER: z.string().email().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      
      // In development, log warnings instead of throwing
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️  Environment validation warnings:');
        missingVars.forEach(msg => console.warn(`   ${msg}`));
        console.warn('   Some features may not work correctly.\n');
        
        // Return a partial env object for development
        return {
          NODE_ENV: (process.env.NODE_ENV as any) || 'development',
          DATABASE_URL: process.env.DATABASE_URL || '',
          JWT_SECRET: process.env.JWT_SECRET || 'dev-fallback-secret-key-minimum-32-chars',
          NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
          SMTP_HOST: process.env.SMTP_HOST,
          SMTP_PORT: process.env.SMTP_PORT,
          SMTP_USER: process.env.SMTP_USER,
          SMTP_PASS: process.env.SMTP_PASS,
          SMTP_FROM: process.env.SMTP_FROM,
        };
      }
      
      // In production, still throw the error
      throw new Error(
        `Environment validation failed:\n${missingVars.join('\n')}\n\nPlease check your .env file and ensure all required variables are set.`
      );
    }
    throw error;
  }
}

// Validate environment variables at module load
export const env = validateEnv();

// Re-export commonly used values
export const {
  NODE_ENV,
  DATABASE_URL,
  JWT_SECRET,
  NEXT_PUBLIC_BASE_URL,
} = env;
