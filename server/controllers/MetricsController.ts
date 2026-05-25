import { Request, Response } from "express";
import { MetricsService } from "../services/MetricsService";

/**
 * MetricsController - REST controller providing telemetry metrics for Recharts dashboard graphics.
 */
export class MetricsController {
  private metricsService = new MetricsService();

  getRecentMetrics = async (req: Request, res: Response) => {
    try {
      const recordLimit = req.query.limit ? parseInt(req.query.limit as string) : 30;
      const list = await this.metricsService.getRecentMetrics(recordLimit);
      return res.json(list);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  };

  getLatestMetrics = async (req: Request, res: Response) => {
    try {
      const metric = await this.metricsService.getLatestMetrics();
      if (!metric) return res.status(404).json({ error: "No telemetry metrics recorded yet." });
      return res.json(metric);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  };

  getAggregates = async (req: Request, res: Response) => {
    try {
      const data = await this.metricsService.calculateAggregates();
      return res.json(data);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  };

  getCostComparison = async (req: Request, res: Response) => {
    try {
      const data = await this.metricsService.getCostComparisonData();
      return res.json(data);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  };
}
