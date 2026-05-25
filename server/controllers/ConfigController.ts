import { Request, Response } from "express";
import { ConfigRepository } from "../repositories/ConfigRepository";
import { z } from "zod";

const updateConfigSchema = z.object({
  value: z.string().min(1, "Value cannot be empty.")
});

/**
 * ConfigController - RestController managing SSM Parameter configurations.
 */
export class ConfigController {
  private configRepo = new ConfigRepository();

  getParameters = async (req: Request, res: Response) => {
    try {
      const list = await this.configRepo.findAll();
      return res.json(list);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  };

  getParameterByKey = async (req: Request, res: Response) => {
    try {
      const key = req.params.key;
      const param = await this.configRepo.findByKey(key);
      if (!param) return res.status(404).json({ error: `Parameter with key ${key} not found.` });
      
      return res.json(param);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  };

  updateParameter = async (req: Request, res: Response) => {
    try {
      const key = req.params.key;
      const parseResult = updateConfigSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ error: parseResult.error.errors[0].message });
      }

      const param = await this.configRepo.findByKey(key);
      if (!param) return res.status(404).json({ error: `Parameter with key ${key} not found.` });

      const updated = await this.configRepo.update(key, parseResult.data.value);
      return res.json(updated);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  };

  createParameter = async (req: Request, res: Response) => {
    try {
      const createSchema = z.object({
        key: z.string().min(1, "Key is required.").regex(/^[A-Z_]+$/, "Key must be UPPERCASE_ONLY (e.g. SCORER_MODE)."),
        value: z.string().min(1, "Value is required."),
        description: z.string().min(1, "Description is required."),
        type: z.string().default("String")
      });

      const parseResult = createSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: parseResult.error.errors[0].message });
      }

      const { key, value, description, type } = parseResult.data;
      
      const existing = await this.configRepo.findByKey(key);
      if (existing) {
        return res.status(409).json({ error: `Parameter with key ${key} already exists.` });
      }

      const created = await this.configRepo.create({ key, value, description, type });
      return res.status(201).json(created);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  };

  deleteParameter = async (req: Request, res: Response) => {
    try {
      const key = req.params.key;
      const param = await this.configRepo.findByKey(key);
      if (!param) return res.status(404).json({ error: `Parameter with key ${key} not found.` });

      await this.configRepo.delete(key);
      return res.json({ message: `Parameter ${key} deleted successfully.` });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  };
}
