import { db } from "../db";
import { parameterStore, ParameterStore, InsertParameterStore } from "../../shared/schema";
import { eq } from "drizzle-orm";

/**
 * ConfigRepository - Handles interactions with the database table mapping
 * parameters for the simulated AWS Systems Manager Parameter Store.
 */
export class ConfigRepository {
  
  async findAll(): Promise<ParameterStore[]> {
    return await db.select().from(parameterStore);
  }

  async findByKey(key: string): Promise<ParameterStore | undefined> {
    const [result] = await db.select().from(parameterStore).where(eq(parameterStore.key, key));
    return result;
  }

  async update(key: string, value: string): Promise<ParameterStore> {
    const [result] = await db.update(parameterStore)
      .set({ value, updatedAt: new Date() })
      .where(eq(parameterStore.key, key))
      .returning();
    return result;
  }

  async create(param: InsertParameterStore): Promise<ParameterStore> {
    const [result] = await db.insert(parameterStore).values(param).returning();
    return result;
  }

  async delete(key: string): Promise<void> {
    await db.delete(parameterStore).where(eq(parameterStore.key, key));
  }
}
