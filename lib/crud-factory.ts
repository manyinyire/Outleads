import { prisma } from '@/lib/prisma';
import { AuthenticatedRequest } from '@/lib/auth';
import { z } from 'zod';
import {
  errorResponse,
  successResponse,
  withErrorHandler,
  validateRequestBody,
  extractId,
  extractPaginationParams,
  calculatePaginationMeta
} from './api-utils';

/**
 * Configuration for CRUD operations
 */
export interface CrudConfig<T = any> {
  modelName: keyof typeof prisma;
  entityName: string;
  createSchema?: z.ZodSchema;
  updateSchema?: z.ZodSchema;
  includeRelations?: Record<string, any>;
  orderBy?: Record<string, 'asc' | 'desc'>;
  searchFields?: string[];
  beforeCreate?: (data: any, req: AuthenticatedRequest) => Promise<any>;
  afterCreate?: (record: T, req: AuthenticatedRequest) => Promise<void> | void;
  beforeUpdate?: (id: string, data: any, req: AuthenticatedRequest) => Promise<any>;
  afterUpdate?: (record: T, req: AuthenticatedRequest) => Promise<void> | void;
  beforeDelete?: (id: string, req: AuthenticatedRequest) => Promise<void> | void;
  afterDelete?: (id: string, req: AuthenticatedRequest) => Promise<void> | void;
  canDelete?: (record: any) => Promise<{ allowed: boolean; reason?: string }>;
}

/**
 * Creates a generic GET handler for listing records
 */
export function createGetHandler<T>(config: CrudConfig<T>) {
  return withErrorHandler(async (req: AuthenticatedRequest) => {
    const url = (req as any).url || (req as any).nextUrl?.href || '';
    const { page, limit, sortBy, sortOrder } = extractPaginationParams(url);
    const skip = ((page || 1) - 1) * (limit || 10);
    
    // Build query conditions
    const queryConditions: any = {};
    
    // Add search functionality if search fields are configured
    if (config.searchFields?.length) {
      const reqUrl = (req as any).url || (req as any).nextUrl?.href || '';
      const url = new URL(reqUrl);
      const searchQuery = url.searchParams.get('search');
      
      if (searchQuery) {
        queryConditions.OR = config.searchFields.map(field => ({
          [field]: {
            contains: searchQuery,
            mode: 'insensitive'
          }
        }));
      }
    }
    
    // Get the model reference
    const model = prisma[config.modelName] as any;
    
    // Execute queries in parallel for better performance
    const [records, total] = await Promise.all([
      model.findMany({
        where: queryConditions,
        skip,
        take: limit || 10,
        orderBy: sortBy 
          ? { [sortBy]: sortOrder }
          : config.orderBy || { createdAt: 'desc' },
        include: config.includeRelations
      }),
      model.count({ where: queryConditions })
    ]);
    
    const meta = calculatePaginationMeta(total, page || 1, limit || 10);
    
    return successResponse({
      data: records,
      meta
    });
  });
}

/**
 * Creates a generic GET handler for retrieving a single record
 */
export function createGetByIdHandler<T>(config: CrudConfig<T>) {
  return withErrorHandler(async (
    req: AuthenticatedRequest,
    { params }: { params: { id: string } }
  ) => {
    const idResult = extractId(params);
    if (!idResult.success) return idResult.error;
    
    const model = prisma[config.modelName] as any;
    
    const record = await model.findUnique({
      where: { id: idResult.id },
      include: config.includeRelations
    });
    
    if (!record) {
      return errorResponse(`${config.entityName} not found`, 404);
    }
    
    return successResponse(record);
  });
}

/**
 * Creates a generic POST handler for creating records
 */
export function createPostHandler<T>(config: CrudConfig<T>) {
  return withErrorHandler(async (req: AuthenticatedRequest) => {
    // Validate request body if schema is provided
    if (config.createSchema) {
      const validation = await validateRequestBody(req as any as Request, config.createSchema);
      if (!validation.success) return validation.error;
      
      let data = validation.data;
      
      // Apply beforeCreate hook if provided
      if (config.beforeCreate) {
        data = await config.beforeCreate(data, req);
      }
      
      const model = prisma[config.modelName] as any;
      
      const record = await model.create({
        data,
        include: config.includeRelations
      });
      
      // Apply afterCreate hook if provided
      if (config.afterCreate) {
        await config.afterCreate(record, req);
      }
      
      return successResponse(
        {
          message: `${config.entityName} created successfully`,
          data: record
        },
        201
      );
    }
    
    // If no schema provided, parse JSON directly
    const body = await (req as any).json();
    
    let data = body;
    if (config.beforeCreate) {
      data = await config.beforeCreate(data, req);
    }
    
    const model = prisma[config.modelName] as any;
    
    const record = await model.create({
      data,
      include: config.includeRelations
    });
    
    if (config.afterCreate) {
      await config.afterCreate(record, req);
    }
    
    return successResponse(
      {
        message: `${config.entityName} created successfully`,
        data: record
      },
      201
    );
  });
}

/**
 * Creates a generic PUT handler for updating records
 */
export function createPutHandler<T>(config: CrudConfig<T>) {
  return withErrorHandler(async (
    req: AuthenticatedRequest,
    { params }: { params: { id: string } }
  ) => {
    const idResult = extractId(params);
    if (!idResult.success) return idResult.error;
    
    const model = prisma[config.modelName] as any;
    
    // Check if record exists
    const existingRecord = await model.findUnique({
      where: { id: idResult.id }
    });
    
    if (!existingRecord) {
      return errorResponse(`${config.entityName} not found`, 404);
    }
    
    // Validate request body if schema is provided
    let data: any;
    
    if (config.updateSchema) {
      const validation = await validateRequestBody(req as any as Request, config.updateSchema);
      if (!validation.success) return validation.error;
      data = validation.data;
    } else {
      data = await (req as any).json();
    }
    
    // Apply beforeUpdate hook if provided
    if (config.beforeUpdate) {
      data = await config.beforeUpdate(idResult.id, data, req);
    }
    
    const record = await model.update({
      where: { id: idResult.id },
      data,
      include: config.includeRelations
    });
    
    // Apply afterUpdate hook if provided
    if (config.afterUpdate) {
      await config.afterUpdate(record, req);
    }
    
    return successResponse({
      message: `${config.entityName} updated successfully`,
      data: record
    });
  });
}

/**
 * Creates a generic DELETE handler
 */
export function createDeleteHandler<T>(config: CrudConfig<T>) {
  return withErrorHandler(async (
    req: AuthenticatedRequest,
    { params }: { params: { id: string } }
  ) => {
    const idResult = extractId(params);
    if (!idResult.success) return idResult.error;
    
    const model = prisma[config.modelName] as any;
    
    // Check if record exists
    const existingRecord = await model.findUnique({
      where: { id: idResult.id },
      include: config.includeRelations
    });
    
    if (!existingRecord) {
      return errorResponse(`${config.entityName} not found`, 404);
    }
    
    // Check if deletion is allowed
    if (config.canDelete) {
      const canDeleteResult = await config.canDelete(existingRecord);
      if (!canDeleteResult.allowed) {
        return errorResponse(
          canDeleteResult.reason || `Cannot delete ${config.entityName.toLowerCase()}`,
          409
        );
      }
    }
    
    // Apply beforeDelete hook if provided
    if (config.beforeDelete) {
      await config.beforeDelete(idResult.id, req);
    }
    
    await model.delete({
      where: { id: idResult.id }
    });
    
    // Apply afterDelete hook if provided
    if (config.afterDelete) {
      await config.afterDelete(idResult.id, req);
    }
    
    return successResponse({
      message: `${config.entityName} deleted successfully`
    });
  });
}

/**
 * Creates all CRUD handlers for a model
 */
export function createCrudHandlers<T>(config: CrudConfig<T>) {
  return {
    GET: createGetHandler(config),
    GET_BY_ID: createGetByIdHandler(config),
    POST: createPostHandler(config),
    PUT: createPutHandler(config),
    DELETE: createDeleteHandler(config)
  };
}
