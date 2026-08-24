import axios from "axios";
import { createLogger } from "../services/logger";
import type { PrintOptions } from "@erb/types";

const logger = createLogger("agent-client");

export interface AgentJobSubmission {
  printJobId: string;
  documentStorageKey: string;
  options: PrintOptions;
  printerModel: string;
  copies: number;
}

export interface AgentJobResult {
  success: boolean;
  errorMessage?: string;
  pagesProduced?: number;
}

/**
 * Client for communicating with print agents running in shop environments.
 * Each agent is identified by its agentId.
 * In development/stub mode, this simulates success.
 */
class PrintAgentClient {
  private readonly agentSecret = process.env.AGENT_SECRET ?? "";
  private readonly agentRegistryUrl =
    process.env.AGENT_REGISTRY_URL ?? "http://localhost:3001";

  private async getAgentUrl(agentId: string): Promise<string> {
    // In Phase 5b, this will look up the registered agent's URL from DB/cache.
    // For Phase 5a (stub), agents are at a known address.
    if (process.env.PRINT_AGENT_URL) {
      return process.env.PRINT_AGENT_URL;
    }
    // Look up agent URL from database
    const { prisma } = await import("@erb/database/client");
    const printer = await prisma.printer.findFirst({
      where: { agentId },
    });
    if (!printer) {
      throw new Error(`No printer found for agentId: ${agentId}`);
    }
    // Agent URL convention: agents register their URL in the DB
    // For now, use environment fallback
    return process.env.PRINT_AGENT_URL ?? "http://localhost:3001";
  }

  async submitJob(
    agentId: string,
    submission: AgentJobSubmission
  ): Promise<AgentJobResult> {
    // STUB MODE — simulate printing without real hardware
    if (process.env.PRINT_AGENT_STUB === "true") {
      return this.stubPrint(submission);
    }

    try {
      const agentUrl = await this.getAgentUrl(agentId);
      const response = await axios.post<AgentJobResult>(
        `${agentUrl}/api/jobs/${submission.printJobId}/print`,
        submission,
        {
          headers: {
            Authorization: `Bearer ${this.agentSecret}`,
            "Content-Type": "application/json",
          },
          timeout: 120000, // 2 minute timeout for large jobs
        }
      );
      return response.data;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message =
          err.response?.data?.error?.message ?? err.message;
        logger.error("Agent request failed", {
          agentId,
          printJobId: submission.printJobId,
          status: err.response?.status,
          message,
        });
        return { success: false, errorMessage: message };
      }
      throw err;
    }
  }

  async checkAgentHealth(agentId: string): Promise<boolean> {
    if (process.env.PRINT_AGENT_STUB === "true") return true;
    try {
      const agentUrl = await this.getAgentUrl(agentId);
      const response = await axios.get(`${agentUrl}/health`, {
        headers: { Authorization: `Bearer ${this.agentSecret}` },
        timeout: 5000,
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  /**
   * STUB: Simulates successful printing with configurable delay.
   * Used during development when no real print agent is available.
   * Clearly marked — never ship this as "real" printing.
   */
  private async stubPrint(
    submission: AgentJobSubmission
  ): Promise<AgentJobResult> {
    const delayMs = Number(process.env.STUB_PRINT_DELAY_MS ?? 3000);
    logger.info("[STUB] Simulating print job", {
      printJobId: submission.printJobId,
      copies: submission.copies,
      delayMs,
    });

    await new Promise((resolve) => setTimeout(resolve, delayMs));

    // Simulate 5% failure rate in stub mode for testing retry logic
    if (process.env.STUB_FAILURE_RATE) {
      const failureRate = parseFloat(process.env.STUB_FAILURE_RATE);
      if (Math.random() < failureRate) {
        return {
          success: false,
          errorMessage: "[STUB] Simulated print failure for testing",
        };
      }
    }

    logger.info("[STUB] Print job completed successfully", {
      printJobId: submission.printJobId,
    });

    return { success: true, pagesProduced: submission.copies * 1 };
  }
}

export const agentClient = new PrintAgentClient();
